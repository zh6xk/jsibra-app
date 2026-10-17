// EffectCraft Anchor Point 3x3 Bridge Script
// Adapted from Prime Tools logic for EffectCraft layer manipulation

class EffectCraftAnchorBridge {
    constructor(layer) {
        this.layer = layer;
    }

    // pos: 1 (Top-Left) to 9 (Bottom-Right)
    setAnchorPoint(pos, currentTime = 0) {
        if (!this.layer) return false;

        // Get bounding box dimensions of the layer source at current time
        const rect = this.layer.sourceRectAtTime ? this.layer.sourceRectAtTime(currentTime, false) : { left: 0, top: 0, width: 100, height: 100 };
        
        const row = Math.floor((pos - 1) / 3); // 0: Top, 1: Middle, 2: Bottom
        const col = (pos - 1) % 3;             // 0: Left, 1: Center, 2: Right

        let x = rect.left;
        let y = rect.top;

        // Calculate X based on column
        if (col === 1) x += rect.width / 2;
        else if (col === 2) x += rect.width;

        // Calculate Y based on row
        if (row === 1) y += rect.height / 2;
        else if (row === 2) y += rect.height;

        // Apply anchor point & compensate position to prevent jumping
        const oldAnchor = this.layer.anchorPoint || [0, 0];
        this.layer.anchorPoint = [x, y];

        if (this.layer.position) {
            const scaleX = (this.layer.scale ? this.layer.scale[0] : 100) / 100;
            const scaleY = (this.layer.scale ? this.layer.scale[1] : 100) / 100;
            
            const xMove = (x - oldAnchor[0]) * scaleX;
            const yMove = (y - oldAnchor[1]) * scaleY;

            this.layer.position[0] += xMove;
            this.layer.position[1] += yMove;
        }

        console.info(`[EffectCraft Bridge] Anchor point set to position ${pos} -> [${x}, ${y}]`);
        return true;
    }
}

// Export for EffectCraft Script Runner / MCP Agent
if (typeof module !== 'undefined') {
    module.exports = EffectCraftAnchorBridge;
}
