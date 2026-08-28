import { Component, Input } from '@angular/core';
import { SyllabicRotationWord } from './syllabic-rotation.puzzle-type';

@Component({
  selector: 'app-syllabic-rotation-visual',
  templateUrl: './syllabic-rotation-visual.component.html',
  styleUrl: './syllabic-rotation-visual.component.scss',
})
export class SyllabicRotationVisualComponent {
  @Input({ required: true }) word!: SyllabicRotationWord;
}
