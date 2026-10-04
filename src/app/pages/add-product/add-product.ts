import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { DealRadarService } from '../../services/deal-radar.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-product.html',
  styleUrl: './add-product.scss'
})
export class AddProduct implements OnInit {
  productForm: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  productId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private dealService: DealRadarService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productForm = this.fb.group({
      productName: ['', Validators.required],
      category: ['', Validators.required],
      targetPrice: [0, [Validators.required, Validators.min(1)]],
      movementType: ['Fast Move', Validators.required],
      links: this.fb.array([
        this.createLinkGroup()
      ])
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.productId = +id;
        this.loadProductData(this.productId);
      }
    });
  }

  loadProductData(id: number) {
    this.dealService.getProductById(id).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          productName: product.productName,
          category: product.category,
          targetPrice: product.targetPrice,
          movementType: product.movementType
        });

        // Clear existing default link
        while (this.links.length !== 0) {
          this.links.removeAt(0);
        }

        // Add links from product
        if (product.links && product.links.length > 0) {
          product.links.forEach((link: any) => {
            this.links.push(this.fb.group({
              websiteName: [link.websiteName || ''],
              productUrl: [link.productUrl || '', Validators.required]
            }));
          });
        } else {
          this.addLink();
        }
      },
      error: (err) => {
        this.toastr.error('Failed to load product details');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  get links(): FormArray {
    return this.productForm.get('links') as FormArray;
  }

  createLinkGroup(): FormGroup {
    return this.fb.group({
      websiteName: [''], // Can be auto-detected
      productUrl: ['', Validators.required]
    });
  }

  addLink() {
    this.links.push(this.createLinkGroup());
  }

  removeLink(index: number) {
    if (this.links.length > 1) {
      this.links.removeAt(index);
    }
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload = this.productForm.value;

    if (this.isEditMode && this.productId) {
      this.dealService.updateProduct(this.productId, payload).subscribe({
        next: (res) => {
          this.toastr.success('Product updated successfully');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.toastr.error('Error updating product');
          this.isSubmitting = false;
        }
      });
    } else {
      this.dealService.createProduct(payload).subscribe({
        next: (res) => {
          this.toastr.success('Product created successfully');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.toastr.error('Error creating product');
          this.isSubmitting = false;
        }
      });
    }
  }
}
