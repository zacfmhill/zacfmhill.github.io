export class Rect {
    constructor(topLeftX, topLeftY, width = 0, height = 0) {
        this.x = topLeftX;
        this.y = topLeftY;
        this.width = width;
        this.height = height;
        this.cx = topLeftX + width / 2;
        this.cy = topLeftY + height / 2;
    }

    static distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.hypot(dx, dy);
    }
    draw_rect(ctx) {
        ctx.save();
        ctx.strokeStyle = '#F00';
        ctx.beginPath();
        ctx.rect(this.x, this.y,
            this.width, this.height);
        ctx.stroke();
        ctx.restore();

    }

}