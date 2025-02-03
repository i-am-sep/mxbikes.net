document.addEventListener('DOMContentLoaded', () => {
    // Show initial content
    document.querySelector('.main-content').style.marginTop = '100vh';
    
    // Auto-scroll to downloads section after 5 seconds
    setTimeout(() => {
        const downloadSection = document.getElementById('download-section');
        if (downloadSection) {
            document.querySelector('.main-content').style.marginTop = '0';
            downloadSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 5000);
});
