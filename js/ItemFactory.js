import * as THREE from 'three';

const ITEM_BUILDERS = {};

function register(name, builder) {
  ITEM_BUILDERS[name] = builder;
}

function group(...children) {
  const g = new THREE.Group();
  children.forEach(c => g.add(c));
  return g;
}

function mesh(geometry, color, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.6,
    metalness: opts.metalness ?? 0.1,
    ...opts
  });
  const m = new THREE.Mesh(geometry, mat);
  if (opts.position) m.position.set(...opts.position);
  if (opts.scale) m.scale.set(...opts.scale);
  if (opts.rotation) m.rotation.set(...opts.rotation);
  return m;
}

// --- Fruits ---
register('Apple', () => group(
  mesh(new THREE.SphereGeometry(0.18, 16, 12), 0xcc2222),
  mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 6), 0x4a3728, { position: [0, 0.2, 0] }),
  mesh(new THREE.SphereGeometry(0.04, 8, 6), 0x228822, { position: [0.05, 0.22, 0], rotation: [0, 0, -0.5] })
));

register('Banana', () => {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.2, 0, 0),
    new THREE.Vector3(-0.05, 0.08, 0),
    new THREE.Vector3(0.1, 0.05, 0),
    new THREE.Vector3(0.22, -0.02, 0)
  ]);
  const geo = new THREE.TubeGeometry(curve, 12, 0.06, 8, false);
  return mesh(geo, 0xffdd44);
});

register('Orange', () => group(
  mesh(new THREE.SphereGeometry(0.17, 16, 12), 0xff8800),
  mesh(new THREE.SphereGeometry(0.02, 6, 4), 0x228822, { position: [0, 0.17, 0] })
));

register('Grapes', () => {
  const g = new THREE.Group();
  const colors = [0x6a0dad, 0x8b008b, 0x9932cc];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col <= row; col++) {
      const s = mesh(new THREE.SphereGeometry(0.06, 8, 6), colors[row % 3], {
        position: [(col - row / 2) * 0.1, -row * 0.1 + 0.1, 0]
      });
      g.add(s);
    }
  }
  g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 4), 0x4a3728, { position: [0, 0.22, 0] }));
  return g;
});

register('Strawberry', () => group(
  mesh(new THREE.ConeGeometry(0.12, 0.22, 8), 0xcc2244, { rotation: [Math.PI, 0, 0] }),
  mesh(new THREE.ConeGeometry(0.14, 0.06, 6), 0x228822, { position: [0, 0.12, 0] })
));

register('Watermelon', () => group(
  mesh(new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0x228822, { rotation: [Math.PI, 0, 0] }),
  mesh(new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0xff4444, { rotation: [Math.PI, 0, 0], position: [0, -0.02, 0] })
));

register('Pineapple', () => group(
  mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.25, 12), 0xffcc00),
  mesh(new THREE.ConeGeometry(0.16, 0.15, 8), 0x228822, { position: [0, 0.2, 0] })
));

register('Peach', () => mesh(new THREE.SphereGeometry(0.16, 12, 10), 0xffaa66));

register('Pear', () => {
  const g = new THREE.Group();
  g.add(mesh(new THREE.SphereGeometry(0.14, 12, 10), 0xc8d400, { position: [0, -0.05, 0], scale: [1, 1.2, 1] }));
  g.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), 0xc8d400, { position: [0, 0.12, 0] }));
  return g;
});

register('Lemon', () => mesh(new THREE.SphereGeometry(0.14, 12, 10), 0xffee44, { scale: [0.9, 1.1, 0.9] }));

register('Mango', () => group(
  mesh(new THREE.SphereGeometry(0.12, 12, 10), 0xff8800, { scale: [0.8, 1.3, 0.8] }),
  mesh(new THREE.SphereGeometry(0.08, 8, 6), 0xff6600, { position: [0, 0.14, 0], scale: [0.7, 0.8, 0.7] })
));

register('Cherry', () => group(
  mesh(new THREE.SphereGeometry(0.08, 10, 8), 0xcc0022, { position: [-0.06, 0, 0] }),
  mesh(new THREE.SphereGeometry(0.08, 10, 8), 0xcc0022, { position: [0.06, 0, 0] }),
  mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.15, 4), 0x4a3728, { position: [-0.06, 0.12, 0] }),
  mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.15, 4), 0x4a3728, { position: [0.06, 0.12, 0] })
));

// --- Vegetables ---
register('Carrot', () => group(
  mesh(new THREE.ConeGeometry(0.06, 0.35, 8), 0xff7722, { rotation: [Math.PI, 0, 0] }),
  mesh(new THREE.ConeGeometry(0.04, 0.08, 6), 0x228822, { position: [0, 0.2, 0] })
));

register('Broccoli', () => group(
  mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.15, 8), 0x228833, { position: [0, -0.05, 0] }),
  mesh(new THREE.SphereGeometry(0.14, 10, 8), 0x33aa44, { position: [0, 0.1, 0], scale: [1, 0.8, 1] })
));

register('Lettuce', () => group(
  mesh(new THREE.SphereGeometry(0.18, 12, 8), 0x66cc44, { scale: [1, 0.7, 1] }),
  mesh(new THREE.SphereGeometry(0.12, 8, 6), 0x88dd55, { position: [0.08, 0.05, 0] }),
  mesh(new THREE.SphereGeometry(0.1, 8, 6), 0x77cc44, { position: [-0.07, 0.04, 0.05] })
));

register('Tomato', () => group(
  mesh(new THREE.SphereGeometry(0.16, 12, 10), 0xdd2222),
  mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.04, 8), 0x228822, { position: [0, 0.16, 0] })
));

register('Potato', () => mesh(new THREE.SphereGeometry(0.14, 10, 8), 0xc4a060, { scale: [1.1, 0.85, 0.95] }));

register('Onion', () => group(
  mesh(new THREE.SphereGeometry(0.15, 12, 10), 0xddbb88, { scale: [1, 1.1, 1] }),
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 6), 0xccaa66, { position: [0, 0.18, 0] })
));

register('Cucumber', () => mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 10), 0x228833, { rotation: [0, 0, Math.PI / 2] }));

register('Bell Pepper', () => mesh(new THREE.SphereGeometry(0.15, 10, 8), 0xdd2222, { scale: [1, 1.2, 1] }));

register('Cauliflower', () => group(
  mesh(new THREE.SphereGeometry(0.16, 12, 10), 0xf5f5dc),
  mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 8), 0x228833, { position: [0, -0.12, 0] })
));

register('Spinach', () => {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    g.add(mesh(new THREE.SphereGeometry(0.06, 6, 4), 0x228833, {
      position: [Math.cos(i * 1.2) * 0.08, i * 0.04, Math.sin(i * 1.2) * 0.08],
      scale: [1, 2, 0.3]
    }));
  }
  return g;
});

register('Zucchini', () => mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.35, 10), 0x336633, { rotation: [0, 0, Math.PI / 2] }));

register('Celery', () => group(
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8), 0x88cc66, { position: [-0.04, 0, 0] }),
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8), 0x77bb55, { position: [0.04, 0.02, 0] })
));

// --- Dairy ---
register('Milk', () => group(
  mesh(new THREE.BoxGeometry(0.14, 0.28, 0.14), 0xffffff),
  mesh(new THREE.BoxGeometry(0.12, 0.04, 0.001), 0x4488cc, { position: [0, 0.05, 0.071] })
));

register('Cheddar Cheese', () => mesh(new THREE.BoxGeometry(0.2, 0.06, 0.2), 0xffaa00));

register('Butter', () => group(
  mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), 0xffee88),
  mesh(new THREE.BoxGeometry(0.13, 0.01, 0.09), 0xffffff, { position: [0, 0.035, 0] })
));

register('Yogurt', () => group(
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12), 0xffffff),
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), 0xff88aa, { position: [0, 0.07, 0] })
));

register('Cream', () => group(
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.15, 12), 0xffffff),
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12), 0x4488cc, { position: [0, 0.09, 0] })
));

register('Cottage Cheese', () => group(
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), 0xffffff),
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12), 0xeeeeee, { position: [0, 0.06, 0] })
));

register('Mozzarella', () => mesh(new THREE.SphereGeometry(0.12, 12, 10), 0xfff8f0));

register('Sour Cream', () => group(
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12), 0xffffff),
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), 0x88cc44, { position: [0, 0.06, 0] })
));

register('Greek Yogurt', () => group(
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12), 0xffffff),
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), 0x4488cc, { position: [0, 0.06, 0] })
));

register('Heavy Cream', () => group(
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 12), 0xffffff),
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12), 0xcc8844, { position: [0, 0.1, 0] })
));

register('Whipped Cream', () => group(
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12), 0xffffff),
  mesh(new THREE.ConeGeometry(0.07, 0.1, 12), 0xffffff, { position: [0, 0.11, 0] })
));

register('Goat Cheese', () => mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12), 0xfff5ee));

// --- Meat ---
register('Chicken Breast', () => mesh(new THREE.BoxGeometry(0.22, 0.08, 0.14), 0xffccaa));

register('Beef Steak', () => mesh(new THREE.BoxGeometry(0.2, 0.05, 0.18), 0x882222));

register('Pork Chop', () => group(
  mesh(new THREE.BoxGeometry(0.18, 0.05, 0.16), 0xffaaaa),
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8), 0xffcccc, { position: [0, 0.04, 0] })
));

register('Bacon', () => mesh(new THREE.BoxGeometry(0.25, 0.02, 0.1), 0xcc6644));

register('Sausage', () => mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 10), 0xcc5533, { rotation: [0, 0, Math.PI / 2] }));

register('Ham Slice', () => mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16), 0xff9988));

register('Turkey', () => mesh(new THREE.BoxGeometry(0.2, 0.06, 0.16), 0xddaa88));

register('Lamb Chop', () => group(
  mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), 0xcc8877, { position: [0, 0.04, 0] }),
  mesh(new THREE.SphereGeometry(0.06, 8, 6), 0xcc8877, { position: [0, 0, 0] })
));

register('Ground Beef', () => group(
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), 0x882222),
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 12), 0xffffff, { position: [0, 0.04, 0] })
));

register('Ribs', () => mesh(new THREE.BoxGeometry(0.25, 0.06, 0.12), 0x994433));

register('Pepperoni', () => mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), 0xcc3322));

register('Salami', () => mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 16), 0xcc4433));

// --- Bakery ---
register('Croissant', () => {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.15, 0, 0),
    new THREE.Vector3(-0.05, 0.06, 0.02),
    new THREE.Vector3(0.05, 0.04, -0.02),
    new THREE.Vector3(0.15, 0, 0)
  ]);
  return mesh(new THREE.TubeGeometry(curve, 16, 0.05, 8, false), 0xdaa520);
});

register('Bread Loaf', () => mesh(new THREE.BoxGeometry(0.22, 0.12, 0.14), 0xc4a060));

register('Baguette', () => mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.4, 10), 0xdaa060, { rotation: [0, 0, Math.PI / 2] }));

register('Muffin', () => group(
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), 0xc48850),
  mesh(new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xc48850, { position: [0, 0.04, 0] })
));

register('Donut', () => group(
  mesh(new THREE.TorusGeometry(0.12, 0.05, 8, 16), 0xc48850),
  mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 16), 0xff88aa, { position: [0, 0.03, 0] })
));

register('Bagel', () => mesh(new THREE.TorusGeometry(0.12, 0.05, 8, 16), 0xc48850));

register('Pretzel', () => {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.1, 0, 0),
    new THREE.Vector3(-0.05, 0.12, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.05, 0.12, 0),
    new THREE.Vector3(0.1, 0, 0)
  ]);
  return mesh(new THREE.TubeGeometry(curve, 20, 0.03, 6, false), 0xc48850);
});

register('Cinnamon Roll', () => group(
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16), 0xc48850),
  mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 12), 0x884422, { position: [0, 0.04, 0], rotation: [Math.PI / 2, 0, 0] })
));

register('Danish', () => group(
  mesh(new THREE.BoxGeometry(0.14, 0.04, 0.14), 0xc48850),
  mesh(new THREE.SphereGeometry(0.04, 8, 6), 0xff6644, { position: [0, 0.04, 0] })
));

register('Cookie', () => mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16), 0xc48850));

register('Cake Slice', () => group(
  mesh(new THREE.BoxGeometry(0.16, 0.1, 0.12), 0xffccaa),
  mesh(new THREE.BoxGeometry(0.16, 0.03, 0.12), 0xff88aa, { position: [0, 0.065, 0] })
));

register('Pie', () => group(
  mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16), 0xc48850),
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), 0xcc4422, { position: [0, 0.035, 0] })
));

// --- Staple food ---
register('Rice', () => group(
  mesh(new THREE.BoxGeometry(0.14, 0.2, 0.08), 0xffffff),
  mesh(new THREE.BoxGeometry(0.12, 0.06, 0.001), 0x4488cc, { position: [0, 0.04, 0.041] })
));

register('Pasta', () => group(
  mesh(new THREE.BoxGeometry(0.12, 0.18, 0.06), 0x4488cc),
  mesh(new THREE.BoxGeometry(0.1, 0.04, 0.001), 0xffcc00, { position: [0, 0.04, 0.031] })
));

register('Flour', () => group(
  mesh(new THREE.BoxGeometry(0.14, 0.2, 0.08), 0xffffff),
  mesh(new THREE.BoxGeometry(0.12, 0.06, 0.001), 0x4488cc, { position: [0, 0.04, 0.041] })
));

register('Salt', () => group(
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12), 0xffffff),
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 12), 0x4488cc, { position: [0, 0.075, 0] })
));

register('Sugar', () => group(
  mesh(new THREE.BoxGeometry(0.12, 0.16, 0.08), 0xffffff),
  mesh(new THREE.BoxGeometry(0.1, 0.05, 0.001), 0xff88aa, { position: [0, 0.03, 0.041] })
));

register('Olive Oil', () => group(
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12), 0x88aa22, { transparent: true, opacity: 0.7 }),
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), 0x448844, { position: [0, 0.13, 0] })
));

register('Black Beans', () => group(
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 12), 0xcc8844),
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12), 0x448844, { position: [0, 0.06, 0] })
));

register('Lentils', () => group(
  mesh(new THREE.BoxGeometry(0.12, 0.16, 0.06), 0x448844),
  mesh(new THREE.BoxGeometry(0.1, 0.04, 0.001), 0xff8800, { position: [0, 0.03, 0.031] })
));

register('Oats', () => group(
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 12), 0xcc8844),
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 12), 0x448844, { position: [0, 0.085, 0] })
));

register('Cereal', () => group(
  mesh(new THREE.BoxGeometry(0.14, 0.22, 0.08), 0xffcc00),
  mesh(new THREE.BoxGeometry(0.12, 0.08, 0.001), 0xff4444, { position: [0, 0.04, 0.041] })
));

register('Noodles', () => group(
  mesh(new THREE.BoxGeometry(0.1, 0.16, 0.06), 0xffcc00),
  mesh(new THREE.BoxGeometry(0.08, 0.04, 0.001), 0x448844, { position: [0, 0.03, 0.031] })
));

register('Bread Crumbs', () => group(
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12), 0xcc8844),
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12), 0x448844, { position: [0, 0.075, 0] })
));

// --- Frozen ---
register('Frozen Pizza', () => group(
  mesh(new THREE.BoxGeometry(0.25, 0.03, 0.25), 0xcc4422),
  mesh(new THREE.BoxGeometry(0.24, 0.01, 0.24), 0xffcc00, { position: [0, 0.02, 0] })
));

register('Ice Cream Tub', () => group(
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 12), 0xffffff),
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12), 0x4488cc, { position: [0, 0.08, 0] })
));

register('Frozen Fries', () => group(
  mesh(new THREE.BoxGeometry(0.18, 0.12, 0.06), 0xff4444),
  mesh(new THREE.BoxGeometry(0.16, 0.04, 0.001), 0xffcc00, { position: [0, 0.02, 0.031] })
));

register('Frozen Veggies', () => group(
  mesh(new THREE.BoxGeometry(0.16, 0.14, 0.04), 0x448844),
  mesh(new THREE.BoxGeometry(0.14, 0.04, 0.001), 0x88ccff, { position: [0, 0.02, 0.021] })
));

register('Frozen Fish', () => group(
  mesh(new THREE.BoxGeometry(0.2, 0.06, 0.1), 0x88ccff),
  mesh(new THREE.BoxGeometry(0.18, 0.04, 0.001), 0x4488cc, { position: [0, 0.01, 0.051] })
));

register('Frozen Berries', () => group(
  mesh(new THREE.BoxGeometry(0.14, 0.12, 0.04), 0x8844aa),
  mesh(new THREE.BoxGeometry(0.12, 0.04, 0.001), 0x88ccff, { position: [0, 0.02, 0.021] })
));

register('Frozen Waffles', () => group(
  mesh(new THREE.BoxGeometry(0.16, 0.1, 0.04), 0xc48850),
  mesh(new THREE.BoxGeometry(0.14, 0.04, 0.001), 0x88ccff, { position: [0, 0.02, 0.021] })
));

register('Frozen Burrito', () => group(
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 10), 0xcc8844, { rotation: [0, 0, Math.PI / 2] }),
  mesh(new THREE.BoxGeometry(0.04, 0.04, 0.001), 0x88ccff, { position: [0, 0, 0.061] })
));

register('Frozen Peas', () => group(
  mesh(new THREE.BoxGeometry(0.14, 0.12, 0.04), 0x448844),
  mesh(new THREE.BoxGeometry(0.12, 0.04, 0.001), 0x88ccff, { position: [0, 0.02, 0.021] })
));

register('Frozen Lasagna', () => group(
  mesh(new THREE.BoxGeometry(0.2, 0.06, 0.16), 0xcc4422),
  mesh(new THREE.BoxGeometry(0.18, 0.04, 0.001), 0x88ccff, { position: [0, 0.01, 0.081] })
));

register('Popsicle', () => group(
  mesh(new THREE.BoxGeometry(0.06, 0.18, 0.04), 0xff6644),
  mesh(new THREE.BoxGeometry(0.04, 0.08, 0.03), 0xc48850, { position: [0, -0.13, 0] })
));

register('Chicken Nuggets', () => group(
  mesh(new THREE.BoxGeometry(0.16, 0.12, 0.06), 0xc48850),
  mesh(new THREE.BoxGeometry(0.14, 0.04, 0.001), 0x88ccff, { position: [0, 0.02, 0.031] })
));

// --- Desserts ---
register('Chocolate Bar', () => group(
  mesh(new THREE.BoxGeometry(0.18, 0.03, 0.1), 0x4a2500),
  mesh(new THREE.BoxGeometry(0.16, 0.01, 0.001), 0x8b4513, { position: [0, 0.01, 0.051] })
));

register('Gummy Bears', () => group(
  mesh(new THREE.BoxGeometry(0.14, 0.12, 0.04), 0xff4488),
  mesh(new THREE.SphereGeometry(0.04, 8, 6), 0xff6644, { position: [-0.03, 0.02, 0.025] }),
  mesh(new THREE.SphereGeometry(0.04, 8, 6), 0x44ff44, { position: [0.03, -0.02, 0.025] })
));

register('Pudding Cup', () => group(
  mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.08, 12), 0xffffff),
  mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.03, 12), 0x8844aa, { position: [0, 0.055, 0] })
));

register('Jello', () => group(
  mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), 0x44ff44, { transparent: true, opacity: 0.75 }),
  mesh(new THREE.BoxGeometry(0.12, 0.02, 0.12), 0xffffff, { position: [0, 0.05, 0] })
));

register('Marshmallow', () => mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12), 0xffffff));

register('Ice Cream Cone', () => group(
  mesh(new THREE.ConeGeometry(0.08, 0.15, 12), 0xc48850, { rotation: [Math.PI, 0, 0] }),
  mesh(new THREE.SphereGeometry(0.1, 10, 8), 0xffccaa, { position: [0, 0.1, 0] })
));

register('Brownie', () => mesh(new THREE.BoxGeometry(0.14, 0.05, 0.14), 0x4a2500));

register('Cheesecake', () => group(
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16), 0xfff8dc),
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16), 0xffccaa, { position: [0, 0.04, 0] })
));

register('Tiramisu', () => group(
  mesh(new THREE.BoxGeometry(0.16, 0.06, 0.12), 0xc48850),
  mesh(new THREE.BoxGeometry(0.16, 0.02, 0.12), 0xfff8dc, { position: [0, 0.04, 0] })
));

register('Macaroon', () => group(
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12), 0xff88aa),
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12), 0xffccaa, { position: [0, 0.03, 0] })
));

register('Candy Cane', () => {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.1, 0),
    new THREE.Vector3(0, 0.05, 0),
    new THREE.Vector3(0.06, 0.1, 0),
    new THREE.Vector3(0.1, 0.05, 0)
  ]);
  return mesh(new THREE.TubeGeometry(curve, 12, 0.025, 6, false), 0xff0000);
});

register('Lollipop', () => group(
  mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 6), 0xffffff),
  mesh(new THREE.SphereGeometry(0.08, 10, 8), 0xff4488, { position: [0, 0.14, 0] })
));

// --- Beverages (alcoholic) ---
function bottle(color, labelColor) {
  return group(
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 10), color, { transparent: true, opacity: 0.8 }),
    mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.06, 8), color, { position: [0, 0.155, 0] }),
    mesh(new THREE.BoxGeometry(0.08, 0.06, 0.001), labelColor, { position: [0, 0, 0.051] })
  );
}

register('Beer', () => bottle(0xffcc00, 0x448844));
register('Red Wine', () => bottle(0x660022, 0xffffff));
register('Whiskey', () => bottle(0xc48850, 0x884422));
register('Vodka', () => bottle(0xeeeeee, 0x4488cc));
register('Rum', () => bottle(0x884422, 0xffcc00));
register('Gin', () => bottle(0xccddcc, 0x448844));
register('Champagne', () => group(
  mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.28, 10), 0xffeeaa, { transparent: true, opacity: 0.7 }),
  mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.08, 8), 0xcccccc, { position: [0, 0.18, 0] })
));
register('Cider', () => bottle(0xffaa44, 0x884422));
register('Tequila', () => bottle(0xeeeecc, 0x448844));
register('Brandy', () => bottle(0x884422, 0xffcc00));
register('Liqueur', () => bottle(0xff4488, 0xffffff));
register('Ale', () => bottle(0xcc8844, 0x448844));

// --- Snacks ---
register('Potato Chips', () => group(
  mesh(new THREE.BoxGeometry(0.2, 0.28, 0.06), 0xffcc00),
  mesh(new THREE.BoxGeometry(0.18, 0.1, 0.001), 0xff4444, { position: [0, 0.04, 0.031] })
));

register('Popcorn', () => group(
  mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.14, 12), 0xff4444),
  mesh(new THREE.SphereGeometry(0.04, 6, 4), 0xffeeaa, { position: [0, 0.1, 0] }),
  mesh(new THREE.SphereGeometry(0.035, 6, 4), 0xffeeaa, { position: [0.04, 0.08, 0.02] }),
  mesh(new THREE.SphereGeometry(0.03, 6, 4), 0xffeeaa, { position: [-0.03, 0.09, -0.02] })
));

register('Pretzels', () => group(
  mesh(new THREE.BoxGeometry(0.14, 0.18, 0.06), 0x448844),
  mesh(new THREE.BoxGeometry(0.12, 0.06, 0.001), 0xc48850, { position: [0, 0.03, 0.031] })
));

register('Mixed Nuts', () => group(
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12), 0xcc8844),
  mesh(new THREE.SphereGeometry(0.03, 6, 4), 0xc48850, { position: [0.02, 0.06, 0] }),
  mesh(new THREE.SphereGeometry(0.025, 6, 4), 0x884422, { position: [-0.02, 0.05, 0.01] })
));

register('Crackers', () => group(
  mesh(new THREE.BoxGeometry(0.16, 0.14, 0.05), 0xffcc00),
  mesh(new THREE.BoxGeometry(0.14, 0.05, 0.001), 0x448844, { position: [0, 0.02, 0.026] })
));

register('Trail Mix', () => group(
  mesh(new THREE.BoxGeometry(0.12, 0.16, 0.06), 0x448844),
  mesh(new THREE.BoxGeometry(0.1, 0.05, 0.001), 0xff8800, { position: [0, 0.03, 0.031] })
));

register('Beef Jerky', () => group(
  mesh(new THREE.BoxGeometry(0.14, 0.18, 0.04), 0x884422),
  mesh(new THREE.BoxGeometry(0.12, 0.06, 0.001), 0xcc4422, { position: [0, 0.03, 0.021] })
));

register('Granola Bar', () => mesh(new THREE.BoxGeometry(0.14, 0.04, 0.06), 0xc48850));

register('Cheese Puffs', () => group(
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 12), 0xff8800),
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), 0xff4444, { position: [0, 0.1, 0] })
));

register('Rice Cakes', () => group(
  mesh(new THREE.BoxGeometry(0.14, 0.16, 0.05), 0x448844),
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), 0xfff8dc, { position: [0, 0.02, 0.026] })
));

register('Nachos', () => group(
  mesh(new THREE.BoxGeometry(0.16, 0.14, 0.05), 0xffcc00),
  mesh(new THREE.BoxGeometry(0.14, 0.05, 0.001), 0xff4444, { position: [0, 0.02, 0.026] })
));

register('Tortilla Chips', () => group(
  mesh(new THREE.BoxGeometry(0.16, 0.18, 0.05), 0xffcc00),
  mesh(new THREE.BoxGeometry(0.14, 0.06, 0.001), 0x448844, { position: [0, 0.03, 0.026] })
));

/** Fallback generic box for unknown items */
function genericItem(color) {
  return mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), color);
}

export function createItemMesh(itemName, categoryColor = 0xffffff) {
  const builder = ITEM_BUILDERS[itemName];
  const model = builder ? builder() : genericItem(categoryColor);

  model.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const wrapper = new THREE.Group();
  wrapper.add(model);
  wrapper.userData.itemName = itemName;
  return wrapper;
}

export function createDecoyMesh(categoryColor) {
  const shapes = [
    () => mesh(new THREE.BoxGeometry(0.12, 0.15, 0.08), categoryColor),
    () => mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 8), categoryColor),
    () => mesh(new THREE.SphereGeometry(0.08, 8, 6), categoryColor)
  ];
  const shape = shapes[Math.floor(Math.random() * shapes.length)]();
  const g = new THREE.Group();
  g.add(shape);
  return g;
}
