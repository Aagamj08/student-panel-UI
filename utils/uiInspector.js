async function inspectElement(locator, name) {
  return await locator.evaluate((element, elementName) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return {
      name: elementName,
      tag: element.tagName.toLowerCase(),
      text: element.innerText?.trim() || '',
      visible: !!(
        element.offsetWidth ||
        element.offsetHeight ||
        element.getClientRects().length
      ),
      enabled: !element.disabled,
      position: {
        x: Math.round(rect.x),
        y: Math.round(rect.y)
      },
      size: {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      typography: {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        textAlign: style.textAlign,
        color: style.color
      },
      appearance: {
        backgroundColor: style.backgroundColor,
        border: style.border,
        borderTop: style.borderTop,
        borderRight: style.borderRight,
        borderBottom: style.borderBottom,
        borderLeft: style.borderLeft,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
        opacity: style.opacity
      },
      spacing: {
        margin: style.margin,
        marginTop: style.marginTop,
        marginRight: style.marginRight,
        marginBottom: style.marginBottom,
        marginLeft: style.marginLeft,
        padding: style.padding,
        paddingTop: style.paddingTop,
        paddingRight: style.paddingRight,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        gap: style.gap
      },
      layout: {
        display: style.display,
        position: style.position,
        overflow: style.overflow,
        overflowX: style.overflowX,
        overflowY: style.overflowY,
        flexDirection: style.flexDirection,
        alignItems: style.alignItems,
        justifyContent: style.justifyContent
      },
      accessibility: {
        ariaLabel: element.getAttribute('aria-label'),
        ariaLabelledBy: element.getAttribute('aria-labelledby'),
        ariaDescribedBy: element.getAttribute('aria-describedby'),
        role: element.getAttribute('role'),
        title: element.getAttribute('title')
      }
    };
  }, name);
}

async function inspectElements(locator, namePrefix = 'Element') {
  const count = await locator.count();
  const elements = [];

  for (let index = 0; index < count; index += 1) {
    const element = locator.nth(index);

    if (!(await element.isVisible().catch(() => false))) {
      continue;
    }

    elements.push(
      await inspectElement(
        element,
        `${namePrefix} ${index + 1}`
      )
    );
  }

  return elements;
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function comparableProperties() {
  return [
    'typography.fontFamily',
    'typography.fontSize',
    'typography.fontWeight',
    'typography.lineHeight',
    'typography.letterSpacing',
    'typography.textAlign',
    'typography.color',
    'appearance.backgroundColor',
    'appearance.border',
    'appearance.borderRadius',
    'appearance.boxShadow',
    'spacing.padding',
    'spacing.gap',
    'layout.display',
    'layout.alignItems',
    'layout.justifyContent'
  ];
}

function readNestedValue(object, path) {
  return path.split('.').reduce(
    (current, key) =>
      current === null || current === undefined
        ? undefined
        : current[key],
    object
  );
}

function compareElements(reference, candidate, options = {}) {
  const properties =
    options.properties || comparableProperties();

  const differences = [];

  for (const property of properties) {
    const expected = normalizeValue(
      readNestedValue(reference, property)
    );

    const actual = normalizeValue(
      readNestedValue(candidate, property)
    );

    if (expected !== actual) {
      differences.push({
        property,
        expected,
        actual
      });
    }
  }

  return {
    passed: differences.length === 0,
    reference: reference.name,
    candidate: candidate.name,
    differences
  };
}

function compareElementGroup(elements, options = {}) {
  if (!elements || elements.length < 2) {
    return {
      passed: true,
      compared: elements?.length || 0,
      differences: [],
      message: 'At least two visible elements are required for comparison.'
    };
  }

  const reference = elements[0];
  const comparisons = [];

  for (let index = 1; index < elements.length; index += 1) {
    const result = compareElements(
      reference,
      elements[index],
      options
    );

    comparisons.push(result);
  }

  return {
    passed: comparisons.every((result) => result.passed),
    compared: elements.length,
    reference: reference.name,
    comparisons
  };
}

function findOutliers(elements, property) {
  const groups = new Map();

  for (const element of elements || []) {
    const value = normalizeValue(
      readNestedValue(element, property)
    );

    if (!groups.has(value)) {
      groups.set(value, []);
    }

    groups.get(value).push(element.name);
  }

  return Array.from(groups.entries()).map(
    ([value, names]) => ({
      value,
      names,
      count: names.length
    })
  );
}

function comparePropertyAcrossElements(
  elements,
  property
) {
  const groups = findOutliers(elements, property);

  return {
    property,
    passed: groups.length <= 1,
    groups
  };
}

async function inspectPageComponent(
  page,
  locator,
  componentName
) {
  return {
    component: componentName,
    url: page.url(),
    elements: await inspectElements(
      locator,
      componentName
    )
  };
}

async function inspectPageComponents(
  page,
  components
) {
  const results = {};

  for (const component of components) {
    results[component.name] =
      await inspectPageComponent(
        page,
        component.locator,
        component.name
      );
  }

  return results;
}

module.exports = {
  inspectElement,
  inspectElements,
  inspectPageComponent,
  inspectPageComponents,
  compareElements,
  compareElementGroup,
  comparePropertyAcrossElements,
  findOutliers,
  comparableProperties,
  readNestedValue,
  normalizeValue
};