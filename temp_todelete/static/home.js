document.addEventListener('DOMContentLoaded', () => {
    // Auto-scroll to downloads section after 5 seconds
    setTimeout(() => {
        const downloadSection = document.getElementById('download-section');
        if (downloadSection) {
            downloadSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 5000);
});
