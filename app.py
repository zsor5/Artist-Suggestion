
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from scipy import sparse  # <--- ADD THIS

from sklearn.metrics.pairwise import cosine_similarity
# --- 1. ADD THIS AT THE TOP ---
CLUSTER_NAMES = {
    0: "Indie",
    1: "Alternative",
    2: "Electronic",
    3: "Hip-Hop",
    4: "Pop", 
    5: "Pop-Punk",
    6: "Metal",
    7: "Dance"
    # Add all your cluster numbers here!
}
app = Flask(__name__)
CORS(app)  # This allows your local HTML file to talk to this Python server

# --- 1. LOAD DATA ONCE ---
# Ensure these files are in the same folder as this script!
try:
    df = pd.read_csv("artists_with_clusters.csv").reset_index(drop=True)
    tfidf_matrix = sparse.load_npz("tfidf_matrix.npz").tocsr()
    print("🚀 Data and Matrix loaded successfully!")
except Exception as e:
    print(f"❌ Error loading data: {e}")

# --- 2. THE OPTIMIZED ENGINE ---
def recommend_artists(input_artists):
    # Find matching rows
    input_rows = df[df['artist_lastfm'].isin(input_artists)]
    if input_rows.empty:
        return []

    input_indices = input_rows.index.tolist()
    input_cluster_ids = set(input_rows['cluster'].unique())

    # Calculate average vector and similarity
    input_vectors = tfidf_matrix[input_indices]
    target_vector = np.asarray(input_vectors.mean(axis=0)).reshape(1, -1)
    similarity_scores = cosine_similarity(target_vector, tfidf_matrix).flatten()

    # Fast Vectorized Boosting
    mask = df['cluster'].isin(input_cluster_ids).values
    similarity_scores[mask] *= 1.2
    
    # Exclude original inputs
    similarity_scores[input_indices] = -1

    # Get Top 3
    top3_indices = np.argsort(similarity_scores)[-3:][::-1]

    recommendations = []
    for idx in top3_indices:
        row = df.iloc[idx]
        cluster_id = int(row['cluster'])
        
         # Use the actual column name from your CSV here
    cluster_num = int(row['cluster_id']) 
    
    # Look up the name (e.g., 0 becomes "Indie")
    display_name = CLUSTER_NAMES.get(cluster_num, f"Cluster {cluster_num}")
    
    recommendations.append({
        'name': row['artist_lastfm'],
        'display_name': display_name, # This is the "Indie/Metal/Pop" string
        'svd_coordinates': [float(row['svd_1']), float(row['svd_2'])]
    })
    return recommendations

# --- 3. THE ENDPOINT ---
@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    selected_artists = data.get('artists', [])
    
    if not selected_artists:
        return jsonify({"error": "No artists provided"}), 400
        
    results = recommend_artists(selected_artists)
    return jsonify(results)

if __name__ == '__main__':
    # Running on port 5000 by default
    app.run(debug=True, port=5000)
