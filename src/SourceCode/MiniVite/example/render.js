export function render(container, text) {
    container.innerHTML = `<h1>${text}</h1><p>Served by MiniVite (ESM)</p>`;
    console.log('Render module loaded!');
}
