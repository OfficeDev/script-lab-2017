/**
 * Helper for creating and querying Dictionaries.
 * A rudimentary alternative to ES6 Maps.
 */
export class Dictionary<T> {
    /**
     * @constructor     
     * @param {object} items Initial seed of items.        
    */
    constructor(protected items?: { [index: string]: T }) {
        if (this.items == null) this.items = {};
    }
    
    /**
     * Gets an item from the dictionary.
     *
     * @param {string} key The key of the item.
     * @return {object} Returns an item if found, else returns null.
     */
    get(key: string): T {
        if (this.items == null) throw new Error('Dictionary isn\'t initialized. Call \'new\' first.');
        if (!this.contains(key)) return null;
        return this.items[key];
    }

    /**
     * Adds an item into the dictionary.
     * If the key already exists, then it will throw.
     *
     * @param {string} key The key of the item.
     * @param {object} value The item to be added.
     * @return {object} Returns the added item.
     */
    add(key: string, value: T): T {
        if (this.contains(key)) throw new Error('Key already exists.');
        return this.insert(key, value);
    };

    /**
     * Gets the first time of the dictionary     
     *
     * @return {object} Returns the first item in the dictionary.
     */
    first() {
        if (this.items == null) throw new Error('Dictionary isn\'t initialized. Call \'new\' first.');
        var key = this.keys()[0];
        if (key != null) return this.items[key];
    }

    /**
     * Inserts an item into the dictionary.     
     *
     * @param {string} key The key of the item.
     * @param {object} value The item to be added.
     * @return {object} Returns the added item.
     */
    insert(key: string, value: T): T {
        if (this.items == null) throw new Error('Dictionary isn\'t initialized. Call \'new\' first.');
        if (value == null) throw new Error('Value expected. Got ' + value);
        this.items[key] = value;
        return value;
    }

    /**
     * Removes an item from the dictionary.
     * If the key doesnt exist, then it will throw.
     *
     * @param {string} key The key of the item.
     * @return {object} Returns the deleted item.
     */
    remove(key: string): T {
        if (!this.contains(key)) throw new Error('Key not found.');
        var value = this.items[key];
        delete this.items[key];
        return this.insert(key, value);
    };
    
    /**
     * Clears the dictionary.                    
     */
    clear() {
        this.items = {};
    }

    /**
     * Check if the dictionary contains the given key.
     *
     * @param {string} key The key of the item.
     * @return {boolean} Returns true if the key was found.
     */
    contains(key: string): boolean {
        if (key == null) throw new Error('Key cannot be null or undefined');
        if (this.items == null) throw new Error('Dictionary isn\'t initialized. Call \'new\' first.');
        return this.items.hasOwnProperty(key);
    }

    /**
     * Lists all the keys in the dictionary.
     *     
     * @return {array} Returns all the keys.
     */
    keys(): string[] {
        if (this == null) throw new Error('Dictionary isn\'t initialized. Call \'new\' first.');
        return Object.keys(this.items);
    }

    /**
     * Lists all the values in the dictionary.
     *     
     * @return {array} Returns all the values.
     */
    values(): T[] {
        if (this == null) throw new Error('Dictionary isn\'t initialized. Call \'new\' first.');
        return Object.values(this.items);
    }

    /**
     * Get the dictionary.
     *     
     * @return {object} Returns the dictionary if it contains data else null.
     */
    lookup(): { [key: string]: T } {
        return this.keys().length ? this.items : null;
    }

    /**
     * Number of items in the dictionary.
     *     
     * @return {number} Returns the number of items in the dictionary
     */
    get count(): number {
        return this.values().length;
    };
}