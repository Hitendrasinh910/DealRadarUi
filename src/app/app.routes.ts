import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { AddProduct } from './pages/add-product/add-product';
import { Login } from './pages/login/login';
import { AuthGuard } from '../auth-guard';

export const routes: Routes = [
    {
        path: '', redirectTo: '/login', pathMatch: 'full'
    },
    {
        path: 'login', component: Login
    },
    {
        path: 'dashboard', component: Dashboard, canActivate: [AuthGuard]
    },
    {
        path: 'add-product', component: AddProduct, canActivate: [AuthGuard]
    },
    {
        path: 'edit-product/:id', component: AddProduct, canActivate: [AuthGuard]
    },
    {
        path: '**', redirectTo: '/login'
    }
];
