import { Component } from '@angular/core';

@Component({
  selector: 'app-magic-square-component',
  imports: [],
  templateUrl: './magic-square-component.html',
  styleUrl: './magic-square-component.scss',
})
export class MagicSquareComponent {
  width = 3;

  square: number[][] = [[]];

  constructor() {
    this.initSquare();
  }

  initSquare() {
    this.square = Array.from({ length: this.width }, () => Array(this.width).fill(0));
    console.log(this.square)
  }

  setValue(value: number, x: number, y: number) {
    this.square[x][y] = value;
  }

}
