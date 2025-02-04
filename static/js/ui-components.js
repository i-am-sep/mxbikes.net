/**
 * UI Components for MXBikes.net
 * Handles loading states, error displays, and common UI patterns
 */

export class UIComponents {
    /**
     * Create loading spinner element
     * @param {string} size sm|md|lg
     * @returns {HTMLElement}
     */
    static createLoader(size = 'md') {
        const sizes = {
            sm: 'w-4 h-4',
            md: 'w-8 h-8',
            lg: 'w-12 h-12'
        };
        
        const loader = document.createElement('div');
        loader.className = `animate-spin rounded-full border-4 border-blue-500 border-t-transparent ${sizes[size]}`;
        return loader;
    }

    /**
     * Create error message element
     * @param {string} message Error message to display
     * @param {boolean} retry Whether to show retry button
     * @param {Function} onRetry Retry callback function
     * @returns {HTMLElement}
     */
    static createError(message, retry = true, onRetry = null) {
        const container = document.createElement('div');
        container.className = 'bg-red-500 bg-opacity-10 backdrop-blur-sm rounded-lg p-4 text-center';
        
        const icon = document.createElement('div');
        icon.className = 'text-red-500 text-4xl mb-2';
        icon.innerHTML = '⚠️';
        
        const text = document.createElement('p');
        text.className = 'text-red-500 mb-4';
        text.textContent = message;
        
        container.appendChild(icon);
        container.appendChild(text);
        
        if (retry && onRetry) {
            const button = document.createElement('button');
            button.className = 'bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors';
            button.textContent = 'Retry';
            button.onclick = onRetry;
            container.appendChild(button);
        }
        
        return container;
    }

    /**
     * Create card element
     * @param {Object} data Card data
     * @returns {HTMLElement}
     */
    static createCard({ title, content, image, link }) {
        const card = document.createElement('div');
        card.className = 'bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform duration-200';
        
        if (image) {
            const img = document.createElement('img');
            img.src = image;
            img.alt = title;
            img.className = 'w-full h-48 object-cover';
            card.appendChild(img);
        }
        
        const body = document.createElement('div');
        body.className = 'p-4';
        
        const titleEl = document.createElement('h3');
        titleEl.className = 'text-xl font-bold mb-2 text-blue-400';
        titleEl.textContent = title;
        
        const contentEl = document.createElement('p');
        contentEl.className = 'text-gray-300 mb-4';
        contentEl.textContent = content;
        
        body.appendChild(titleEl);
        body.appendChild(contentEl);
        
        if (link) {
            const linkEl = document.createElement('a');
            linkEl.href = link;
            linkEl.className = 'inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors';
            linkEl.textContent = 'Learn More';
            body.appendChild(linkEl);
        }
        
        card.appendChild(body);
        return card;
    }

    /**
     * Create table element with data
     * @param {Array} headers Table headers
     * @param {Array} data Table data
     * @returns {HTMLElement}
     */
    static createTable(headers, data) {
        const table = document.createElement('table');
        table.className = 'w-full bg-gray-800 rounded-lg overflow-hidden';
        
        const thead = document.createElement('thead');
        thead.className = 'bg-gray-700';
        
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.className = 'px-4 py-2 text-left text-blue-400';
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'border-t border-gray-700 hover:bg-gray-700 transition-colors';
            
            Object.values(row).forEach(cell => {
                const td = document.createElement('td');
                td.className = 'px-4 py-2 text-gray-300';
                td.textContent = cell;
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        return table;
    }

    /**
     * Create notification element
     * @param {string} message Notification message
     * @param {string} type success|error|info|warning
     * @param {number} duration Duration in ms before auto-hide
     * @returns {HTMLElement}
     */
    static createNotification(message, type = 'info', duration = 3000) {
        const types = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };
        
        const notification = document.createElement('div');
        notification.className = `${types[type]} bg-opacity-10 backdrop-blur-sm text-${type}-500 p-4 rounded-lg fixed top-4 right-4 z-50 transform transition-transform duration-300 translate-x-full`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Hide and remove notification
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, duration);
        }
        
        return notification;
    }

    /**
     * Create modal element
     * @param {string} title Modal title
     * @param {HTMLElement|string} content Modal content
     * @param {Function} onClose Close callback function
     * @returns {HTMLElement}
     */
    static createModal(title, content, onClose = null) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50';
        
        const dialog = document.createElement('div');
        dialog.className = 'bg-gray-800 rounded-lg max-w-2xl w-full mx-4 transform transition-transform duration-300 scale-95';
        
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center p-4 border-b border-gray-700';
        
        const titleEl = document.createElement('h2');
        titleEl.className = 'text-xl font-bold text-blue-400';
        titleEl.textContent = title;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'text-gray-400 hover:text-white transition-colors';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => {
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.remove();
                if (onClose) onClose();
            }, 300);
        };
        
        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        
        const body = document.createElement('div');
        body.className = 'p-4';
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.appendChild(content);
        }
        
        dialog.appendChild(header);
        dialog.appendChild(body);
        modal.appendChild(dialog);
        
        // Show modal with animation
        document.body.appendChild(modal);
        setTimeout(() => {
            dialog.classList.remove('scale-95');
            dialog.classList.add('scale-100');
        }, 100);
        
        return modal;
    }
}
