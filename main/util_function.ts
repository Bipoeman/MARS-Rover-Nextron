// Constructor function for creating a ResumableInterval object
export function ResumableInterval(callback, delay) {
    // Private variables to store the interval ID and pause state
    let intervalId;
    let paused = false;

    // Private function to start the interval
    const start = () => {
        // Check if the interval is not paused
        if (!paused) {
            // Set the interval to execute the callback function with the specified delay
            intervalId = setInterval(callback, delay);
        }
    };

    // Private function to pause the interval
    const pause = () => {
        // Clear the interval to stop further executions
        clearInterval(intervalId);
        // Update the pause state
        paused = true;
    };

    // Private function to resume the interval
    const resume = () => {
        // Check if the interval is paused
        if (paused) {
            // Set the interval to resume execution with the specified delay
            intervalId = setInterval(callback, delay);
            // Update the pause state
            paused = false;
        }
    };

    // Private function to stop the interval
    const stop = () => {
        // Clear the interval to stop further executions
        clearInterval(intervalId);
    };

    // Return an object with public methods
    return { start, pause, resume, stop };
}