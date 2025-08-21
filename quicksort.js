/**
 * Quicksort Algorithm Implementation in JavaScript
 * 
 * Quicksort is a highly efficient, comparison-based sorting algorithm that uses
 * a divide-and-conquer strategy. It has an average time complexity of O(n log n)
 * and worst-case O(n²), but with optimizations it performs very well in practice.
 */

/**
 * Standard Quicksort Implementation
 * Time Complexity: Average O(n log n), Worst O(n²)
 * Space Complexity: O(log n) due to recursion stack
 */
function quicksort(arr) {
  // Base case: arrays with 0 or 1 elements are already sorted
  if (arr.length <= 1) {
    return arr;
  }
  
  // Choose pivot (middle element for better performance)
  const pivotIndex = Math.floor(arr.length / 2);
  const pivot = arr[pivotIndex];
  
  // Partition elements around pivot
  const left = [];
  const right = [];
  const equal = [];
  
  for (let i = 0; i < arr.length; i++) {
    if (i === pivotIndex) continue; // Skip pivot element
    
    if (arr[i] < pivot) {
      left.push(arr[i]);
    } else if (arr[i] > pivot) {
      right.push(arr[i]);
    } else {
      equal.push(arr[i]);
    }
  }
  
  // Recursively sort left and right partitions, then combine
  return [...quicksort(left), pivot, ...equal, ...quicksort(right)];
}

/**
 * In-Place Quicksort Implementation (More Memory Efficient)
 * Modifies the original array instead of creating new arrays
 */
function quicksortInPlace(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    const pivotIndex = partition(arr, left, right);
    quicksortInPlace(arr, left, pivotIndex - 1);
    quicksortInPlace(arr, pivotIndex + 1, right);
  }
  return arr;
}

/**
 * Partition function for in-place quicksort
 * Uses Lomuto partition scheme
 */
function partition(arr, left, right) {
  // Choose rightmost element as pivot
  const pivot = arr[right];
  let i = left - 1;
  
  // Move all elements smaller than pivot to the left
  for (let j = left; j < right; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
    }
  }
  
  // Place pivot in its correct position
  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
  return i + 1;
}

/**
 * Optimized Quicksort with Median-of-Three Pivot Selection
 * Better pivot selection reduces chance of worst-case scenario
 */
function quicksortOptimized(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    // Use median-of-three for better pivot selection
    const pivotIndex = medianOfThree(arr, left, right);
    
    // Move pivot to end
    [arr[pivotIndex], arr[right]] = [arr[right], arr[pivotIndex]];
    
    const newPivotIndex = partition(arr, left, right);
    quicksortOptimized(arr, left, newPivotIndex - 1);
    quicksortOptimized(arr, newPivotIndex + 1, right);
  }
  return arr;
}

/**
 * Median-of-three pivot selection
 * Chooses the median of first, middle, and last elements
 */
function medianOfThree(arr, left, right) {
  const mid = Math.floor((left + right) / 2);
  
  // Sort the three elements
  if (arr[left] > arr[mid]) {
    [arr[left], arr[mid]] = [arr[mid], arr[left]];
  }
  if (arr[left] > arr[right]) {
    [arr[left], arr[right]] = [arr[right], arr[left]];
  }
  if (arr[mid] > arr[right]) {
    [arr[mid], arr[right]] = [arr[right], arr[mid]];
  }
  
  // Return middle element index
  return mid;
}

/**
 * Quicksort with Insertion Sort for Small Subarrays
 * Hybrid approach that switches to insertion sort for small arrays
 * (Insertion sort is more efficient for small datasets)
 */
function quicksortHybrid(arr, left = 0, right = arr.length - 1, threshold = 10) {
  if (right - left + 1 <= threshold) {
    insertionSort(arr, left, right);
    return arr;
  }
  
  if (left < right) {
    const pivotIndex = partition(arr, left, right);
    quicksortHybrid(arr, left, pivotIndex - 1, threshold);
    quicksortHybrid(arr, pivotIndex + 1, right, threshold);
  }
  return arr;
}

/**
 * Insertion Sort for small subarrays
 */
function insertionSort(arr, left, right) {
  for (let i = left + 1; i <= right; i++) {
    const key = arr[i];
    let j = i - 1;
    
    while (j >= left && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
}

/**
 * Randomized Quicksort
 * Uses random pivot selection to avoid worst-case scenarios
 */
function quicksortRandomized(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    const pivotIndex = partitionRandomized(arr, left, right);
    quicksortRandomized(arr, left, pivotIndex - 1);
    quicksortRandomized(arr, pivotIndex + 1, right);
  }
  return arr;
}

/**
 * Partition with random pivot selection
 */
function partitionRandomized(arr, left, right) {
  // Choose random pivot
  const randomIndex = Math.floor(Math.random() * (right - left + 1)) + left;
  [arr[randomIndex], arr[right]] = [arr[right], arr[randomIndex]];
  
  return partition(arr, left, right);
}

/**
 * Quicksort with Tail Call Optimization
 * Prevents stack overflow for very large arrays
 */
function quicksortTailOptimized(arr, left = 0, right = arr.length - 1) {
  while (left < right) {
    const pivotIndex = partition(arr, left, right);
    
    // Sort smaller partition first to minimize stack usage
    if (pivotIndex - left < right - pivotIndex) {
      quicksortTailOptimized(arr, left, pivotIndex - 1);
      left = pivotIndex + 1; // Tail call optimization
    } else {
      quicksortTailOptimized(arr, pivotIndex + 1, right);
      right = pivotIndex - 1; // Tail call optimization
    }
  }
  return arr;
}

/**
 * Utility function to check if array is sorted
 */
function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false;
  }
  return true;
}

/**
 * Performance testing function
 */
function benchmarkQuicksort() {
  const testSizes = [100, 1000, 10000, 100000];
  const results = {};
  
  for (const size of testSizes) {
    const arr = Array.from({ length: size }, () => Math.floor(Math.random() * size));
    const arrCopy = [...arr];
    
    console.log(`\nTesting array of size ${size}:`);
    
    // Test standard quicksort
    const start1 = performance.now();
    const sorted1 = quicksort([...arr]);
    const time1 = performance.now() - start1;
    console.log(`Standard Quicksort: ${time1.toFixed(2)}ms, Sorted: ${isSorted(sorted1)}`);
    
    // Test in-place quicksort
    const start2 = performance.now();
    const sorted2 = quicksortInPlace([...arr]);
    const time2 = performance.now() - start2;
    console.log(`In-Place Quicksort: ${time2.toFixed(2)}ms, Sorted: ${isSorted(sorted2)}`);
    
    // Test optimized quicksort
    const start3 = performance.now();
    const sorted3 = quicksortOptimized([...arr]);
    const time3 = performance.now() - start3;
    console.log(`Optimized Quicksort: ${time3.toFixed(2)}ms, Sorted: ${isSorted(sorted3)}`);
    
    // Test hybrid quicksort
    const start4 = performance.now();
    const sorted4 = quicksortHybrid([...arr]);
    const time4 = performance.now() - start4;
    console.log(`Hybrid Quicksort: ${time4.toFixed(2)}ms, Sorted: ${isSorted(sorted4)}`);
  }
}

// Example usage and testing
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    quicksort,
    quicksortInPlace,
    quicksortOptimized,
    quicksortHybrid,
    quicksortRandomized,
    quicksortTailOptimized,
    isSorted,
    benchmarkQuicksort
  };
} else {
  // Browser environment
  window.Quicksort = {
    quicksort,
    quicksortInPlace,
    quicksortOptimized,
    quicksortHybrid,
    quicksortRandomized,
    quicksortTailOptimized,
    isSorted,
    benchmarkQuicksort
  };
}

// Example usage
console.log("Quicksort Algorithm Examples:");
console.log("=============================");

// Test with simple array
const testArray = [64, 34, 25, 12, 22, 11, 90];
console.log("\nOriginal array:", testArray);

const sorted = quicksort([...testArray]);
console.log("Sorted array:", sorted);

const inPlaceArray = [...testArray];
quicksortInPlace(inPlaceArray);
console.log("In-place sorted:", inPlaceArray);

// Test with duplicate elements
const duplicateArray = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
console.log("\nArray with duplicates:", duplicateArray);
console.log("Sorted with duplicates:", quicksort([...duplicateArray]));

// Test with negative numbers
const negativeArray = [-5, 3, -1, 0, 7, -9, 2];
console.log("\nArray with negatives:", negativeArray);
console.log("Sorted with negatives:", quicksort([...negativeArray]));

// Performance benchmark
console.log("\nPerformance Benchmark:");
benchmarkQuicksort();
