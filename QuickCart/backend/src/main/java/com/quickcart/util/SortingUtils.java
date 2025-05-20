package com.quickcart.util;

import com.quickcart.entity.Product;
import java.util.Comparator;
import java.util.List;
import java.util.ArrayList;
import java.math.BigDecimal;

public class SortingUtils {
    

    public static <T> List<T> quickSort(List<T> products, Comparator<T> comparator) {
        if (products.size() <= 1) {
            return new ArrayList<>(products);
        }
        
        List<T> result = new ArrayList<>(products);
        quickSortHelper(result, 0, result.size() - 1, comparator);
        return result;
    }
    
    private static <T> void quickSortHelper(List<T> arr, int low, int high, Comparator<T> comparator) {
        if (low < high) {
            int pi = partition(arr, low, high, comparator);
            quickSortHelper(arr, low, pi - 1, comparator);
            quickSortHelper(arr, pi + 1, high, comparator);
        }
    }
    
    private static <T> int partition(List<T> arr, int low, int high, Comparator<T> comparator) {
        T pivot = arr.get(high);
        int i = (low - 1);
        
        for (int j = low; j < high; j++) {
            if (comparator.compare(arr.get(j), pivot) < 0) {
                i++;
                T temp = arr.get(i);
                arr.set(i, arr.get(j));
                arr.set(j, temp);
            }
        }
        
        T temp = arr.get(i + 1);
        arr.set(i + 1, arr.get(high));
        arr.set(high, temp);
        
        return i + 1;
    }
    

    public static List<Product> binarySearchPriceRange(List<Product> products, BigDecimal minPrice, BigDecimal maxPrice) {

        List<Product> sortedProducts = quickSort(products, Comparator.comparing(Product::getPrice));
        
        int lowerBound = findLowerBound(sortedProducts, minPrice);
        int upperBound = findUpperBound(sortedProducts, maxPrice);
        
        if (lowerBound == -1 || upperBound == -1) {
            return new ArrayList<>();
        }
        
        return sortedProducts.subList(lowerBound, upperBound + 1);
    }
    
    private static int findLowerBound(List<Product> products, BigDecimal target) {
        int left = 0;
        int right = products.size() - 1;
        int result = -1;
        
        while (left <= right) {
            int mid = (left + right) / 2;
            if (products.get(mid).getPrice().compareTo(target) >= 0) {
                result = mid;
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        return result;
    }
    
    private static int findUpperBound(List<Product> products, BigDecimal target) {
        int left = 0;
        int right = products.size() - 1;
        int result = -1;
        
        while (left <= right) {
            int mid = (left + right) / 2;
            if (products.get(mid).getPrice().compareTo(target) <= 0) {
                result = mid;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return result;
    }
} 