// Event Bus (Observer Pattern)
export class EventBus {
    constructor() {
        this.events = {};
    }

    subscribe(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        
        // Return unsubscribe function (closure)
        return () => {
            const index = this.events[event].indexOf(callback);
            if (index > -1) {
                this.events[event].splice(index, 1);
            }
        };
    }

    emit(event, data = null) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }

    // Clear all events
    clear() {
        this.events = {};
    }

    // Get all event names
    getEventNames() {
        return Object.keys(this.events);
    }

    // Get subscriber count for an event
    getSubscriberCount(event) {
        return this.events[event] ? this.events[event].length : 0;
    }
}

// Create a global event bus instance
export const eventBus = new EventBus();