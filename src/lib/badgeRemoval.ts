
/**
 * Removes the Lovable badge from the page if it exists
 * This function should be called once the DOM is loaded
 */
export const removeLovableBadge = () => {
  // Wait for DOM to be fully loaded
  setTimeout(() => {
    try {
      // Find the badge element
      const badge = document.getElementById('lovable-badge');
      if (badge) {
        // Remove the badge from the DOM
        badge.remove();
        console.log('Lovable badge removed successfully');
      }
    } catch (error) {
      console.error('Error removing Lovable badge:', error);
    }
  }, 500);
};

/**
 * Observes the DOM for the Lovable badge and removes it if it appears
 * This handles cases where the badge is added dynamically after initial page load
 */
export const observeBadgeAddition = () => {
  try {
    // Create a mutation observer to watch for badge being added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.id === 'lovable-badge') {
              node.remove();
              console.log('Dynamically added Lovable badge removed');
            }
          });
        }
      });
    });

    // Start observing the body for any changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    return observer;
  } catch (error) {
    console.error('Error setting up badge observer:', error);
    return null;
  }
};
