let allArtists = [];

async function loadArtistsData()
{
    try
    {
        const response = await fetch('artists_with_clusters.csv');
        const csvData = await response.text();

        Papa.parse(csvData, {
            header: true,
            complete: function(results){
                allArtists = results.data.map(row => row.artist_lastfm);
                console.log("Data is ready");
            }
        });
    } catch(error) {
        console.error("Could not find the CSV file");
    }
}
const inputContainers = document.querySelectorAll('.Input-Box');

inputContainers.forEach(container => {
    const input = container.querySelector('.artist-input');
    const list = container.querySelector('.suggestions-list');

    input.addEventListener('input', (e) => {
        const typedText = e.target.value.toLowerCase();
        list.innerHTML = ''; // Clear old suggestions

        if (typedText.length >= 2) {
            const matches = allArtists.filter(name => 
                name && name.toLowerCase().includes(typedText)
            ).slice(0, 10);

            // FIX 4: Call drawing function with the specific list for THIS box
            displaySuggestions(matches, list, input);
        }
    });
});

// Mission 2.5: Updated to handle multiple lists
function displaySuggestions(matches, listElement, inputElement) {
    listElement.innerHTML = '';

    matches.forEach(artistName => {
        const li = document.createElement('li');
        li.textContent = artistName;
        
        li.addEventListener('click', () => {
            inputElement.value = artistName; // Fill the specific input
            listElement.innerHTML = '';     // Clear the specific list
        });

        listElement.appendChild(li);
    });
}

loadArtistsData();
