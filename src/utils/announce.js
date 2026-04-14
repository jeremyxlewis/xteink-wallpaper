let messageQueue = [];
let currentMessage = '';

export function announce(message) {
  messageQueue.push(message);
}

let timeoutRef = null;

export function processQueue(setMessage) {
  if (messageQueue.length > 0 && !timeoutRef) {
    currentMessage = messageQueue.shift();
    setMessage(currentMessage);
    timeoutRef = setTimeout(() => {
      setMessage('');
      timeoutRef = null;
      processQueue(setMessage);
    }, 1000);
  }
}

export function cleanupAnnounce() {
  if (timeoutRef) {
    clearTimeout(timeoutRef);
    timeoutRef = null;
  }
  messageQueue = [];
  currentMessage = '';
}