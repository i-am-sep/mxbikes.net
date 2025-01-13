document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
        if(path === '/downloads.html'){
            const modContainer = document.querySelector('.container:last-of-type'); // Select the last container with mods
            const categories = document.querySelectorAll('.category');
            const searchBar = document.querySelector('.search-bar');
            let allMods = []; // Store all mod data
        
            // Function to fetch and load mods from JSON
            function loadMods() {
                fetch('data/mods.json')
                    .then(response => response.json())
                    .then(data => {
                        allMods = data.mods; // Store all mods
                        renderMods(data.mods);
                    })
                    .catch(error => console.error('Error fetching mods:', error));
            }
            
            // Function to render mods in the DOM
            function renderMods(mods) {
              modContainer.innerHTML = '<h2 class="text-3xl font-bold mb-8">Available Mods</h2>';
              mods.forEach(mod => {
                const modTile = document.createElement('div');
                modTile.classList.add('mod-tile', 'p-4', 'mb-4');
                modTile.setAttribute('data-category', mod.categories.join(' '));
        
                const modHeader = document.createElement('div');
                modHeader.classList.add('flex', 'items-center', 'cursor-pointer');
                modHeader.onclick = () => toggleDescription(modTile);
            
                const modImage = document.createElement('img');
                modImage.src = mod.image;
                modImage.alt = mod.name;
                modImage.classList.add('w-16', 'h-16', 'object-cover', 'rounded-lg', 'mr-4');
                modHeader.appendChild(modImage);
            
                const modTitle = document.createElement('h3');
                modTitle.textContent = mod.name;
                modTitle.classList.add('text-xl', 'font-bold');
                modHeader.appendChild(modTitle);
            
                const downloadButton = document.createElement('button');
                downloadButton.textContent = 'Download';
                downloadButton.classList.add('ml-auto', 'bg-blue-600', 'hover:bg-blue-700', 'px-4', 'py-2', 'rounded-lg');
                downloadButton.onclick = (event) => {
                    event.stopPropagation();
                    showDownloadPopup(mod.id);
                };
                modHeader.appendChild(downloadButton);
        
                modTile.appendChild(modHeader);
        
                const modDescription = document.createElement('div');
                modDescription.classList.add('mod-description', 'mt-4');
                modDescription.innerHTML = `<p class="text-gray-300 mb-4">${mod.description}</p>`;
            
                if (mod.images && mod.images.length > 0) {
                  const imageScroll = document.createElement('div');
                  imageScroll.classList.add('image-scroll', 'py-4');
                  mod.images.forEach(imgSrc => {
                      const img = document.createElement('img');
                      img.src = imgSrc;
                      img.alt = `${mod.name} image`;
                      img.classList.add('h-48', 'rounded-lg');
                      imageScroll.appendChild(img);
                  });
                  modDescription.appendChild(imageScroll);
                  }
                modTile.appendChild(modDescription);
        
                  modContainer.appendChild(modTile);
        
                  // Create Download Popup
                  const popup = document.createElement('div');
                  popup.id = `${mod.id}-popup`;
                  popup.classList.add('mod-download-popup');
                  popup.innerHTML = `<h4 class="text-xl font-bold mb-4">Download Options</h4><div class="flex flex-col space-y-4"></div>`;
        
                  const downloadLinksContainer = popup.querySelector('div');
                  for(const linkText in mod.downloadLinks){
                    const downloadLink = document.createElement('a');
                    downloadLink.href = mod.downloadLinks[linkText];
                    downloadLink.target = '_blank';
                    downloadLink.classList.add('bg-green-600', 'hover:bg-green-700', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded', 'text-center');
                    downloadLink.textContent = linkText;
                    downloadLinksContainer.appendChild(downloadLink);
                  }
                  document.body.appendChild(popup);
              });
              //setupScrollEvents();
            }
        
            function setupScrollEvents(){
              const scrollContainers = document.querySelectorAll('.image-scroll');
              scrollContainers.forEach(container => {
                  container.style.overflowX = 'hidden';
              });
            }
            
              // Load mods on page load
              loadMods();
            
              categories.forEach(category => {
                category.addEventListener('click', () => {
                    categories.forEach(c => c.classList.remove('active'));
                    category.classList.add('active');
            
                    const selectedCategory = category.getAttribute('data-category');
                    
                      // Filter and render mods based on category
                    const filteredMods = selectedCategory === 'all'
                    ? allMods
                    : allMods.filter(mod => mod.categories.includes(selectedCategory));
            
                
                    renderMods(filteredMods);
        
                });
              });
            
            searchBar.addEventListener('input', () => {
              const searchTerm = searchBar.value.toLowerCase();
            
              const filteredMods = allMods.filter(mod => {
                const title = mod.name.toLowerCase();
                const description = mod.description.toLowerCase();
                return title.includes(searchTerm) || description.includes(searchTerm) || mod.categories.some(cat => cat.includes(searchTerm));
              });
                renderMods(filteredMods);
            });
        
        }
    });
    
    
    function openModal() {
      document.getElementById('infoModal').style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
    function closeModal() {
      document.getElementById('infoModal').style.display = 'none';
      document.body.style.overflow = 'auto';
    }
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeModal();
      }
    });
    
    function toggleDescription(element) {
        const description = element.querySelector('.mod-description');
        description.classList.toggle('active');
    }
    
    
    function showDownloadPopup(modId) {
      const popup = document.getElementById(modId + '-popup');
      popup.style.display = 'block';
      document.addEventListener('click', function closePopup(e) {
          if (!popup.contains(e.target)) {
            popup.style.display = 'none';
            document.removeEventListener('click', closePopup);
          }
        });
    }
