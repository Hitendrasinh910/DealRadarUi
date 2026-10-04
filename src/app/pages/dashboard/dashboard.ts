import { Component, OnInit } from '@angular/core';
import { MasterProduct } from '../../models';
import { DealRadarService } from '../../services/deal-radar.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  products: MasterProduct[] = [];
  isLoading = false;
  isChecking: { [id: number]: boolean } = {};

  constructor(
    private dealService: DealRadarService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading = true;
    this.dealService.getProducts().subscribe({
      next: (res) => {
        this.products = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading products', err);
        this.toastr.error('Failed to load products');
        this.isLoading = false;
      },
    });
  }

  checkPrice(id: number) {
    if (this.isChecking[id]) return;
    this.isChecking[id] = true;
    this.toastr.info('Checking prices...');
    this.dealService.checkPrices(id).subscribe({
      next: (res) => {
        this.toastr.success('Prices checked successfully!');
        this.isChecking[id] = false;
        this.loadProducts();
      },
      error: (err) => {
        this.toastr.error('Error checking prices');
        this.isChecking[id] = false;
      }
    });
  }

  deleteProduct(id: number) {
    if(confirm('Are you sure you want to delete this product?')) {
      this.dealService.deleteProduct(id).subscribe({
        next: () => {
          this.toastr.success('Product deleted');
          this.loadProducts();
        },
        error: () => this.toastr.error('Failed to delete product')
      });
    }
  }
}
