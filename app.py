from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from scipy import sparse
from sklearn.metrics.pairwise import cosine_similarity

# --- 1. CONFIGURATION ---
CLUSTER_NAMES = {
    0: "Indie",
    1: "Alternative",
    2: "Electronic",
    3: "Hip-Hop",
    4: "Pop", 
    5: "Pop-Punk",
    6: "Metal",
    7: "Dance"
}

app = Flask(__name__)
CORS(app)

# --- 2. LOAD DATA ---
try:
    # Use reset_index to ensure indices match the tfidf_matrix
    df = pd.read_csv("artists_with_clusters.csv").reset_index(drop=True)
    tfidf_matrix = sparse.load_npz("tfidf_matrix.npz").tocsr()
    print("🚀 Data and Matrix loaded successfully!")
except Exception as e:
    print(f"❌ Error loading data: {e}")

# --- 3. RECOMMENDATION ENGINE ---
def recommend_artists(input_artists):
    input_rows = df[df['artist_lastfm'].isin(input_artists)]
    if input_rows.empty:
        return []

    input_indices = input_rows.index.tolist()
    input_cluster_ids = set(input_rows['cluster'].unique())

    input_vectors = tfidf_matrix[input_indices]
    target_vector = np.asarray(input_vectors.mean(axis=0)).reshape(1, -1)
    similarity_scores = cosine_similarity(target_vector, tfidf_matrix).flatten()

    # Boost results in the same clusters
    mask = df['cluster'].isin(input_cluster_ids).values
    similarity_scores[mask] *= 1.2
    
    # Exclude inputs from results
    similarity_scores[input_indices] = -1

    # Get Top 3
    top3_indices = np.argsort(similarity_scores)[-3:][::-1]

    recommendations = []
    for idx in top3_indices:
        row = df.iloc[idx]
        
        # Get the ID and find the corresponding name from CLUSTER_NAMES
        cluster_num = int(row['cluster']) 
        display_name = CLUSTER_NAMES.get(cluster_num, f"Cluster {cluster_num}")

        recommendations.append({
            'name': row['artist_lastfm'],
            'display_name': display_name,
            'svd_coordinates': [float(row['svd_1']), float(row['svd_2'])]
        })
    return recommendations

# --- 4. ROUTES ---
@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    selected_artists = data.get('artists', [])
    
    if not selected_artists:
        return jsonify({"error": "No artists provided"}), 400
        
    results = recommend_artists(selected_artists)
    return jsonify(results)

if __name__ == '__main__':
    # host 0.0.0.0 is required for Render
    app.run(host='0.0.0.0', port=10000)
