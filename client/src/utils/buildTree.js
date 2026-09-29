export function buildTree(flatNodes) {
  const byId = new Map(flatNodes.map((n) => [n._id, { ...n, children: [] }]));
  const roots = [];

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (list) => {
    list.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    list.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}
