document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const resultsList = document.getElementById('results-list');
    const noResults = document.getElementById('no-results');
    const loadingIndicator = document.getElementById('loading');
    const clothingGrid = document.getElementById('clothing-grid');

    const dataUrl = 'https://myntra-database-lt5b7yjpx-aloki9singh.vercel.app/clothing';
    let clothingData = []; // Initialize empty array

    // Fetch data from the URL
    fetch(dataUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Format the fetched data
            clothingData = data.map(item => ({
                id: item.id, // Assuming there's an id field
                name: item.title, // Using 'title' as the name
                price: `$${Number(item.discounted_price).toFixed(2)}`, // Format price as a string with currency symbol
                image: item.images[0] || 'https://via.placeholder.com/150', // Use the first image
                discount: item.discount // Optional: You can use the discount info if needed
            }));

            // Initial render of all clothing items
            renderClothingGrid(clothingData);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });

    // Function to render clothing items on the home screen
    function renderClothingGrid(items) {
        clothingGrid.innerHTML = ''; // Clear existing items
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'bg-white p-4 border border-gray-200 rounded-lg shadow hover:shadow-lg sm:m-1';
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="w-[500px] h-[500px] object-cover rounded mb-4">
                <h2 class="text-lg font-semibold">${item.name}</h2>
                <p class="text-sm text-gray-500">${item.price}</p>
                ${item.discount ? `<p class="text-sm text-red-500">${item.discount}</p>` : ''}
            `;
            clothingGrid.appendChild(itemElement);
        });
    }

    // Function to calculate the Levenshtein Distance between two strings
    function getLevenshteinDistance(a, b) {
        const matrix = Array.from({ length: a.length + 1 }, () =>
            Array.from({ length: b.length + 1 }, () => 0)
        );

        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                if (a[i - 1] === b[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }
        return matrix[a.length][b.length];
    }

    // Function to find the best matches based on Levenshtein Distance
    function findBestMatches(query, items) {
        return items
            .filter(item => item.name) // Ensure the item has a name
            .map(item => ({
                ...item,
                distance: getLevenshteinDistance(query, item.name.toLowerCase())
            }))
            .sort((a, b) => a.distance - b.distance)
            .filter(item => item.distance <= 3); // Adjust this threshold as needed
    }

    searchInput.addEventListener('input', function() {
        const query = searchInput.value.trim().toLowerCase();

        if (query.length > 3) {
            loadingIndicator.classList.remove('hidden');
            noResults.classList.add('hidden');
            resultsList.innerHTML = '';

            setTimeout(() => {
                const bestMatches = findBestMatches(query, clothingData);

                loadingIndicator.classList.add('hidden');

                if (bestMatches.length > 0) {
                    resultsContainer.classList.remove('hidden');
                    resultsList.innerHTML = ''; // Clear previous results
                    bestMatches.forEach(item => {
                        const resultItem = document.createElement('li');
                        resultItem.className = 'p-4 border-b last:border-none hover:bg-gray-100 cursor-pointer';
                        resultItem.innerHTML = `
                            <div class="flex items-center">
                                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded mr-4">
                                <div>
                                    <h2 class="text-lg font-semibold">${item.name}</h2>
                                    <p class="text-sm text-gray-500">${item.price}</p>
                                    ${item.discount ? `<p class="text-sm text-red-500">${item.discount}</p>` : ''}
                                </div>
                            </div>
                        `;
                        resultsList.appendChild(resultItem);
                    });
                } else {
                    resultsContainer.classList.add('hidden');
                    noResults.classList.remove('hidden');
                }
            }, 500);
        } else {
            resultsContainer.classList.add('hidden');
            noResults.classList.add('hidden');
            loadingIndicator.classList.add('hidden');

            // Re-render the original clothing grid if the query is cleared or too short
            renderClothingGrid(clothingData);
        }
    });
});
