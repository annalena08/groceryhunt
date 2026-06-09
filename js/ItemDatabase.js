export const CATEGORIES = {
  dairy: {
    name: 'Dairy products',
    items: [
      'Milk', 'Cheddar Cheese', 'Butter', 'Yogurt', 'Cream',
      'Cottage Cheese', 'Mozzarella', 'Sour Cream', 'Greek Yogurt', 'Heavy Cream',
      'Whipped Cream', 'Goat Cheese'
    ],
    color: 0xf5f5dc,
    aisle: 0
  },
  meat: {
    name: 'Meat products',
    items: [
      'Chicken Breast', 'Beef Steak', 'Pork Chop', 'Bacon', 'Sausage',
      'Ham Slice', 'Turkey', 'Lamb Chop', 'Ground Beef', 'Ribs',
      'Pepperoni', 'Salami'
    ],
    color: 0xcc4444,
    aisle: 1
  },
  vegetables: {
    name: 'Vegetables',
    items: [
      'Carrot', 'Broccoli', 'Lettuce', 'Tomato', 'Potato',
      'Onion', 'Cucumber', 'Bell Pepper', 'Cauliflower', 'Spinach',
      'Zucchini', 'Celery'
    ],
    color: 0x44aa44,
    aisle: 2
  },
  fruits: {
    name: 'Fruits',
    items: [
      'Apple', 'Banana', 'Orange', 'Grapes', 'Strawberry',
      'Watermelon', 'Pineapple', 'Peach', 'Pear', 'Lemon',
      'Mango', 'Cherry'
    ],
    color: 0xff6644,
    aisle: 3
  },
  bakery: {
    name: 'Bakery products',
    items: [
      'Croissant', 'Bread Loaf', 'Baguette', 'Muffin', 'Donut',
      'Bagel', 'Pretzel', 'Cinnamon Roll', 'Danish', 'Cookie',
      'Cake Slice', 'Pie'
    ],
    color: 0xdaa520,
    aisle: 4
  },
  staple: {
    name: 'Staple food',
    items: [
      'Rice', 'Pasta', 'Flour', 'Salt', 'Sugar',
      'Olive Oil', 'Black Beans', 'Lentils', 'Oats', 'Cereal',
      'Noodles', 'Bread Crumbs'
    ],
    color: 0xc4a882,
    aisle: 5
  },
  frozen: {
    name: 'Frozen stuff',
    items: [
      'Frozen Pizza', 'Ice Cream Tub', 'Frozen Fries', 'Frozen Veggies', 'Frozen Fish',
      'Frozen Berries', 'Frozen Waffles', 'Frozen Burrito', 'Frozen Peas', 'Frozen Lasagna',
      'Popsicle', 'Chicken Nuggets'
    ],
    color: 0x88ccff,
    aisle: 6
  },
  desserts: {
    name: 'Desserts',
    items: [
      'Chocolate Bar', 'Gummy Bears', 'Pudding Cup', 'Jello', 'Marshmallow',
      'Ice Cream Cone', 'Brownie', 'Cheesecake', 'Tiramisu', 'Macaroon',
      'Candy Cane', 'Lollipop'
    ],
    color: 0xff69b4,
    aisle: 7
  },
  beverages: {
    name: 'Beverages (alcoholic)',
    items: [
      'Beer', 'Red Wine', 'Whiskey', 'Vodka', 'Rum',
      'Gin', 'Champagne', 'Cider', 'Tequila', 'Brandy',
      'Liqueur', 'Ale'
    ],
    color: 0x8844aa,
    aisle: 8
  },
  snacks: {
    name: 'Snacks',
    items: [
      'Potato Chips', 'Popcorn', 'Pretzels', 'Mixed Nuts', 'Crackers',
      'Trail Mix', 'Beef Jerky', 'Granola Bar', 'Cheese Puffs', 'Rice Cakes',
      'Nachos', 'Tortilla Chips'
    ],
    color: 0xffaa00,
    aisle: 9
  }
};

/**
 * Pick one random item from each of `size` categories.
 */
export function generateShoppingList(size) {
  const categoryKeys = Object.keys(CATEGORIES);
  const shuffledKeys = [...categoryKeys].sort(() => Math.random() - 0.5);
  const selectedKeys = shuffledKeys.slice(0, size);

  const list = selectedKeys.map(key => {
    const cat = CATEGORIES[key];
    const item = cat.items[Math.floor(Math.random() * cat.items.length)];
    return {
      id: `${key}-${item}`,
      name: item,
      category: key,
      categoryName: cat.name,
      aisle: cat.aisle,
      found: false
    };
  });
  // Shuffle so list order isn't always the same
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function getCategoryKeyForItem(itemName) {
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (cat.items.includes(itemName)) return key;
  }
  return null;
}
