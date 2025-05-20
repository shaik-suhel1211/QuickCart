// Custom QuickSort implementation for sorting products
export const quickSort = (arr, compareFn) => {
    if (arr.length <= 1) return arr;
    
    const pivot = arr[arr.length - 1];
    const left = [];
    const right = [];
    
    for (let i = 0; i < arr.length - 1; i++) {
        if (compareFn(arr[i], pivot) < 0) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }
    
    return [...quickSort(left, compareFn), pivot, ...quickSort(right, compareFn)];
};

// Binary Search implementation for finding products within a price range
export const binarySearchPriceRange = (products, minPrice, maxPrice) => {
    // First sort by price
    const sortedProducts = quickSort([...products], (a, b) => a.price - b.price);
    
    const findLowerBound = (target) => {
        let left = 0;
        let right = sortedProducts.length - 1;
        let result = -1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (sortedProducts[mid].price >= target) {
                result = mid;
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        return result;
    };
    
    const findUpperBound = (target) => {
        let left = 0;
        let right = sortedProducts.length - 1;
        let result = -1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (sortedProducts[mid].price <= target) {
                result = mid;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return result;
    };
    
    const lowerBound = findLowerBound(minPrice);
    const upperBound = findUpperBound(maxPrice);
    
    if (lowerBound === -1 || upperBound === -1) return [];
    return sortedProducts.slice(lowerBound, upperBound + 1);
};

// Hash Map implementation for filtering by brand/category/color
export const filterByAttribute = (products, attribute, value) => {
    // Create a hash map for O(1) lookup
    const hashMap = new Map();
    
    // Group products by the specified attribute
    products.forEach(product => {
        const key = product[attribute].toLowerCase();
        if (!hashMap.has(key)) {
            hashMap.set(key, []);
        }
        hashMap.get(key).push(product);
    });
    
    // Return products matching the value (case-insensitive)
    return hashMap.get(value.toLowerCase()) || [];
};

// Trie implementation for search functionality
class TrieNode {
    constructor() {
        this.children = new Map();
        this.products = new Set();
    }
}

class ProductTrie {
    constructor() {
        this.root = new TrieNode();
    }
    
    insert(product) {
        const words = [
            product.name.toLowerCase(),
            product.description.toLowerCase(),
            product.brand.toLowerCase(),
            product.category.toLowerCase()
        ];
        
        words.forEach(word => {
            let node = this.root;
            for (const char of word) {
                if (!node.children.has(char)) {
                    node.children.set(char, new TrieNode());
                }
                node = node.children.get(char);
                node.products.add(product);
            }
        });
    }
    
    search(prefix) {
        let node = this.root;
        for (const char of prefix.toLowerCase()) {
            if (!node.children.has(char)) {
                return [];
            }
            node = node.children.get(char);
        }
        return Array.from(node.products);
    }
}

export const createProductTrie = (products) => {
    const trie = new ProductTrie();
    products.forEach(product => trie.insert(product));
    return trie;
};

// Custom filter implementation combining all algorithms
export const applyFilters = (products, filters) => {
    let filteredProducts = [...products];
    
    // Apply price range filter using binary search
    if (filters.minPrice !== null || filters.maxPrice !== null) {
        const minPrice = filters.minPrice || 0;
        const maxPrice = filters.maxPrice || Infinity;
        filteredProducts = binarySearchPriceRange(filteredProducts, minPrice, maxPrice);
    }
    
    // Apply brand filter using hash map
    if (filters.brand) {
        filteredProducts = filterByAttribute(filteredProducts, 'brand', filters.brand);
    }
    
    // Apply category filter using hash map
    if (filters.category) {
        filteredProducts = filterByAttribute(filteredProducts, 'category', filters.category);
    }
    
    // Apply color filter using hash map
    if (filters.color) {
        filteredProducts = filterByAttribute(filteredProducts, 'color', filters.color);
    }
    
    // Apply search using trie
    if (filters.searchTerm) {
        const trie = createProductTrie(filteredProducts);
        filteredProducts = trie.search(filters.searchTerm);
    }
    
    // Apply sorting using quick sort
    if (filters.sortBy) {
        const [field, direction] = filters.sortBy.split('_');
        const compareFn = (a, b) => {
            let comparison = 0;
            switch (field) {
                case 'price':
                    comparison = a.price - b.price;
                    break;
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'createdAt':
                    comparison = new Date(a.createdAt) - new Date(b.createdAt);
                    break;
                default:
                    comparison = 0;
            }
            return direction === 'desc' ? -comparison : comparison;
        };
        filteredProducts = quickSort(filteredProducts, compareFn);
    }
    
    return filteredProducts;
}; 