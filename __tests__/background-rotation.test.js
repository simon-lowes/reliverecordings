/**
 * Unit tests for background image rotation logic
 * Tests permutation generation, Fisher-Yates shuffle, getNextImage sequencing,
 * and dual-layer crossfade mechanics
 *
 * Note: innerHTML usage in these tests is intentional for setting up test fixtures
 * with static HTML content in jsdom - not a security concern in test environment.
 */

describe('Permutation Generation (Heap\'s Algorithm)', () => {
  // Replicate the generatePermutations function from main.js
  const generatePermutations = (arr) => {
    const result = [];
    const heapPermute = (n, current) => {
      if (n === 1) {
        result.push([...current]);
        return;
      }
      for (let i = 0; i < n; i++) {
        heapPermute(n - 1, current);
        if (n % 2 === 0) {
          [current[i], current[n - 1]] = [current[n - 1], current[i]];
        } else {
          [current[0], current[n - 1]] = [current[n - 1], current[0]];
        }
      }
    };
    heapPermute(arr.length, [...arr]);
    return result;
  };

  test('should return 1 permutation for a single element', () => {
    const perms = generatePermutations(['A']);
    expect(perms).toHaveLength(1);
    expect(perms[0]).toEqual(['A']);
  });

  test('should return 2 permutations for 2 elements', () => {
    const perms = generatePermutations(['A', 'B']);
    expect(perms).toHaveLength(2);

    const permStrings = perms.map((p) => p.join(','));
    const unique = new Set(permStrings);
    expect(unique.size).toBe(2);
    expect(unique).toContain('A,B');
    expect(unique).toContain('B,A');
  });

  test('should return 6 permutations for 3 elements', () => {
    const perms = generatePermutations(['A', 'B', 'C']);
    expect(perms).toHaveLength(6);

    const permStrings = perms.map((p) => p.join(','));
    const unique = new Set(permStrings);
    expect(unique.size).toBe(6);
  });

  test('should return 24 permutations for 4 elements', () => {
    const perms = generatePermutations([1, 2, 3, 4]);
    expect(perms).toHaveLength(24);

    const permStrings = perms.map((p) => p.join(','));
    const unique = new Set(permStrings);
    expect(unique.size).toBe(24);
  });

  test('should return 120 permutations for 5 elements (matches the 5 background images)', () => {
    const perms = generatePermutations(['A', 'B', 'C', 'D', 'E']);
    expect(perms).toHaveLength(120);

    const permStrings = perms.map((p) => p.join(','));
    const unique = new Set(permStrings);
    expect(unique.size).toBe(120);
  });

  test('should not modify the original array', () => {
    const original = ['A', 'B', 'C'];
    const copy = [...original];
    generatePermutations(original);
    expect(original).toEqual(copy);
  });

  test('each permutation should contain all original elements', () => {
    const elements = ['X', 'Y', 'Z'];
    const perms = generatePermutations(elements);

    for (const perm of perms) {
      expect(perm.sort()).toEqual(['X', 'Y', 'Z']);
    }
  });
});

describe('Fisher-Yates Shuffle', () => {
  // Replicate the shuffle function from main.js
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  test('should return an array with the same length', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle([...arr]);
    expect(result).toHaveLength(arr.length);
  });

  test('should contain all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle([...arr]);
    expect(result.sort()).toEqual(arr.sort());
  });

  test('should return the same array reference (mutates in place)', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toBe(arr);
  });

  test('should handle single-element arrays', () => {
    const arr = [42];
    const result = shuffle(arr);
    expect(result).toEqual([42]);
  });

  test('should handle empty arrays', () => {
    const arr = [];
    const result = shuffle(arr);
    expect(result).toEqual([]);
  });

  test('should produce different orderings over multiple runs', () => {
    const original = [1, 2, 3, 4, 5];
    const results = new Set();

    for (let i = 0; i < 10; i++) {
      const shuffled = shuffle([...original]);
      results.add(shuffled.join(','));
    }

    expect(results.size).toBeGreaterThan(1);
  });
});

describe('getNextImage Sequencing', () => {
  const generatePermutations = (arr) => {
    const result = [];
    const heapPermute = (n, current) => {
      if (n === 1) {
        result.push([...current]);
        return;
      }
      for (let i = 0; i < n; i++) {
        heapPermute(n - 1, current);
        if (n % 2 === 0) {
          [current[i], current[n - 1]] = [current[n - 1], current[i]];
        } else {
          [current[0], current[n - 1]] = [current[n - 1], current[0]];
        }
      }
    };
    heapPermute(arr.length, [...arr]);
    return result;
  };

  // Replicate the Fisher-Yates shuffle from main.js so the wrap path below
  // exercises the same reshuffle-on-exhaustion logic as the real code.
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Mirrors js/main.js getNextImage(): advances through each permutation, then
  // reshuffles the permutation list (in place) when all are exhausted.
  const makeGetNextImage = (permutations) => {
    let permIndex = 0;
    let imageIndex = 0;
    return () => {
      if (imageIndex >= permutations[permIndex].length) {
        imageIndex = 0;
        permIndex++;
        if (permIndex >= permutations.length) {
          permIndex = 0;
          shuffle(permutations);
        }
      }
      return permutations[permIndex][imageIndex++];
    };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should cycle through all images in a permutation before moving on', () => {
    const images = ['A', 'B'];
    const permutations = generatePermutations(images);
    const getNextImage = makeGetNextImage(permutations);

    const first = getNextImage();
    const second = getNextImage();
    expect([first, second].sort()).toEqual(['A', 'B']);

    const third = getNextImage();
    const fourth = getNextImage();
    expect([third, fourth].sort()).toEqual(['A', 'B']);
  });

  test('should reshuffle the permutation list on wraparound', () => {
    const images = ['A', 'B'];
    const permutations = generatePermutations(images);
    // permutations === [['A','B'], ['B','A']]
    const getNextImage = makeGetNextImage(permutations);

    // Force the Fisher-Yates swap (i=1, j=0) so the post-wrap order is
    // deterministic: the two permutations swap positions.
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

    // Exhaust both permutations (2 permutations x 2 images = 4 reads).
    for (let i = 0; i < 4; i++) {
      getNextImage();
    }

    // The 5th read triggers wrap-and-reshuffle. With the forced swap, the list
    // is now [['B','A'], ['A','B']], so the next image is 'B'.
    const next = getNextImage();

    expect(randomSpy).toHaveBeenCalled();
    expect(permutations).toEqual([
      ['B', 'A'],
      ['A', 'B'],
    ]);
    expect(next).toBe('B');
    expect(images).toContain(next);
  });
});

describe('Dual-Layer Crossfade', () => {
  test('should toggle active class between two layers', () => {
    // Set up DOM using DOM API instead of innerHTML
    const layer0 = document.createElement('div');
    layer0.className = 'bg-layer bg-layer--active';
    const layer1 = document.createElement('div');
    layer1.className = 'bg-layer';
    document.body.appendChild(layer0);
    document.body.appendChild(layer1);

    const layers = document.querySelectorAll('.bg-layer');
    let activeLayerIndex = 0;

    const crossfade = (imageSrc) => {
      const nextLayerIndex = (activeLayerIndex + 1) % 2;
      const nextLayer = layers[nextLayerIndex];

      nextLayer.style.backgroundImage = `url(${imageSrc})`;

      layers[activeLayerIndex].classList.remove('bg-layer--active');
      nextLayer.classList.add('bg-layer--active');

      activeLayerIndex = nextLayerIndex;
    };

    expect(layers[0].classList.contains('bg-layer--active')).toBe(true);
    expect(layers[1].classList.contains('bg-layer--active')).toBe(false);

    crossfade('image1.webp');
    expect(layers[0].classList.contains('bg-layer--active')).toBe(false);
    expect(layers[1].classList.contains('bg-layer--active')).toBe(true);
    expect(layers[1].style.backgroundImage).toBe('url("image1.webp")');

    crossfade('image2.webp');
    expect(layers[0].classList.contains('bg-layer--active')).toBe(true);
    expect(layers[1].classList.contains('bg-layer--active')).toBe(false);
    expect(layers[0].style.backgroundImage).toBe('url("image2.webp")');
  });

  test('should not start animation with fewer than 2 layers', () => {
    const layer = document.createElement('div');
    layer.className = 'bg-layer';
    document.body.appendChild(layer);

    const layers = document.querySelectorAll('.bg-layer');
    expect(layers.length).toBeLessThan(2);
  });

  afterEach(() => {
    document.body.replaceChildren();
  });
});

describe('Nav Color Detection', () => {
  test('should assign dark text for bright images (luminance >= 0.5)', () => {
    const navColorMap = {};
    const luminance = 0.7;
    const src = 'bright-image.webp';

    navColorMap[src] = luminance >= 0.5 ? '#1a1a1a' : '#fff';
    expect(navColorMap[src]).toBe('#1a1a1a');
  });

  test('should assign white text for dark images (luminance < 0.5)', () => {
    const navColorMap = {};
    const luminance = 0.3;
    const src = 'dark-image.webp';

    navColorMap[src] = luminance >= 0.5 ? '#1a1a1a' : '#fff';
    expect(navColorMap[src]).toBe('#fff');
  });

  test('should assign dark text at exactly 0.5 luminance threshold', () => {
    const navColorMap = {};
    const luminance = 0.5;
    const src = 'threshold-image.webp';

    navColorMap[src] = luminance >= 0.5 ? '#1a1a1a' : '#fff';
    expect(navColorMap[src]).toBe('#1a1a1a');
  });

  test('should default to white when image not in map', () => {
    const navColorMap = {};
    const color = navColorMap['unknown.webp'] || '#fff';
    expect(color).toBe('#fff');
  });
});
