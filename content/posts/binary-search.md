---
title: Leetcode 系列专题 - 二分查找
date: 2021-03-19 12:40:40
tags: ["二分查找"]
category: cs
---

## 前言

二分查找（Binary Search) 是一种效率较高的查找方法，二分查找也称为折半查找。在面试或算法竞赛中，查找相关的问题最优解通常就是二分查找；如果一个查找问题能够用一个条件消除一半的查找区域，那么就对目标在特定空间搜索，从而减少查找空间。虽然二分查找思路比较直观，但大部分面试者通常在边界处理的时候考虑不全，从而出错。有很多原因导致二分查找处理边界失败！例如，当目标位于数组第 0 个索引时，或位于第(n - 1)个索引时，程序进入死循环。

## 动画演示

![binary-search](../media/2021/cs/binary-search/amimate.gif)

## 基础实现

```js
function binarySearch(arr, target) {
  var h = arr.length - 1,
    l = 0;
  while (l <= h) {
    var m = Math.floor((h + l) / 2);
    if (arr[m] == target) {
      return m;
    }
    if (target > arr[m]) {
      l = m + 1;
    } else {
      h = m - 1;
    }
  }

  return false;
}
```

## 演变

### 搜索插入位置

- 序号：35
- 等级：⭐️ （简单）
- 题目描述：

给定一个排序数组和一个目标值，在数组中找到目标值，并返回其索引。如果目标值不存在于数组中，返回它将会被按顺序插入的位置。请必须使用时间复杂度为 O(log n) 的算法。

```javascript
var searchInsert = function (nums, target) {
  var l = 0;
  var r = nums.length - 1;
  var mid = 0;

  while (l <= r) {
    mid = Math.floor((l + r) / 2);
    if (target === nums[mid]) {
      return mid;
    }

    // 在中间点的右侧
    if (target > nums[mid]) {
      l = mid + 1;
    } else {
      r = mid - 1;
    }
  }

  return target > nums[mid] ? mid + 1 : mid;
};
```

### 第一个错误的版本

- 序号：278
- 等级：⭐️ （简单）
- 题目描述：

  你是产品经理，目前正在带领一个团队开发新的产品。不幸的是，你的产品的最新版本没有通过质量检测。由于每个版本都是基于之前的版本开发的，所以错误的版本之后的所有版本都是错的。
  假设你有 n 个版本 [1, 2, ..., n]，你想找出导致之后所有版本出错的第一个错误的版本。
  你可以通过调用  bool isBadVersion(version)  接口来判断版本号 version 是否在单元测试中出错。实现一个函数来查找第一个错误的版本。你应该尽量减少对调用 API 的次数。

```javascript
/**
 * Definition for isBadVersion()
 *
 * @param {integer} version number
 * @return {boolean} whether the version is bad
 * isBadVersion = function(version) {
 *     ...
 * };
 */

/**
 * @param {function} isBadVersion()
 * @return {function}
 */
var solution = function (isBadVersion) {
  /**
   * @param {integer} n Total versions
   * @return {integer} The first bad version
   */
  return function (n) {
    var l = 0;
    var r = n;

    while (l <= r) {
      var mid = Math.floor((r + l) / 2);

      // 版本不正确
      if (isBadVersion(mid)) {
        if (!isBadVersion(mid - 1)) {
          return mid;
        }
        r = mid - 1;
      } else {
        l = mid + 1;
      }
    }
  };
};
```

### 有效的完全平方数

- 序号：367
- 等级：⭐️ （简单）
- 题目描述：

给定一个 正整数 num ，编写一个函数，如果 num 是一个完全平方数，则返回 true ，否则返回 false 。

进阶：不要 使用任何内置的库函数，如   sqrt 。

```javascript
/**
 * @param {number} num
 * @return {boolean}
 */
var isPerfectSquare = function (num) {
  var l = 0;
  var r = num;

  while (l <= r) {
    var mid = Math.floor((l + r) / 2);
    if (mid * mid === num) {
      return true;
    }

    if (mid * mid > num) {
      r = mid - 1;
    } else {
      l = mid + 1;
    }
  }

  return false;
};
```
