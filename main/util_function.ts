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

export function keypressToSpeed(keypressed){
    console.log(keypressed)
    let left,right
    if (keypressed['W'] === 0 && keypressed['S'] === 0) {
      if (keypressed['D'] === 1 && keypressed['A'] === 0) {
        left = 150;
        right = -150;
      } else if (keypressed['A'] === 1 && keypressed['D'] === 0) {
        left = -150;
        right = 150;
      } else if (keypressed['A'] === 0 && keypressed['D'] === 0) {
        left = 0;
        right = 0;
      } else if (keypressed['A'] === 1 && keypressed['D'] === 1) {
        left = 150;
        right = 150;
      }
    } else if (keypressed['W'] === 1 && keypressed['S'] === 0) {
      if (keypressed['D'] === 1 && keypressed['A'] === 0) {
        left = 255;
        right = 150;
      } else if (keypressed['A'] === 1 && keypressed['D'] === 0) {
        left = 150;
        right = 255;
      } else if (keypressed['A'] === 0 && keypressed['D'] === 0) {
        left = 255;
        right = 255;
      } else if (keypressed['A'] === 1 && keypressed['D'] === 1) {
        left = 255;
        right = 255;
      }
    } else if (keypressed['S'] === 0 && keypressed['W'] === 0) {
      if (keypressed['D'] === 1 && keypressed['A'] === 0) {
        left = -255;
        right = -150;
      } else if (keypressed['A'] === 1 && keypressed['D'] === 0) {
        left = -150;
        right = -255;
      } else if (keypressed['A'] === 0 && keypressed['D'] === 0) {
        left = 0;
        right = 0;
      } else if (keypressed['A'] === 1 && keypressed['D'] === 1) {
        left = -150;
        right = -150;
      }
    } else if (keypressed['S'] === 1 && keypressed['W'] === 0) {
      if (keypressed['D'] === 1 && keypressed['A'] === 0) {
        left = -255;
        right = -150;
      } else if (keypressed['A'] === 1 && keypressed['D'] === 0) {
        left = -150;
        right = -255;
      } else if (keypressed['A'] === 0 && keypressed['D'] === 0) {
        left = -255;
        right = -255;
      } else if (keypressed['A'] === 1 && keypressed['D'] === 1) {
        left = -255;
        right = -255;
      }
    }
    return {
      "left":left,
      "right":right,
    }
  }