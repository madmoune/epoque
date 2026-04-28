import { Routes } from '@angular/router';
import { MagicSquareComponent } from './logic/magic-square/magic-square-component/magic-square-component';

export const routes: Routes = [
    {
        title: 'Magic Square'
        , path: 'magic-square',
        component: MagicSquareComponent
    }
];
