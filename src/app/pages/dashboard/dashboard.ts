import { Component, OnInit } from '@angular/core';
import { MasterProduct, ProductLink } from '../../models';
import { DealRadarService } from '../../services/deal-radar.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  products: MasterProduct[] = [];
  filteredProducts: MasterProduct[] = [];
  isLoading = false;
  isChecking: { [id: number]: boolean } = {};
  lastRefreshedAtIst = '';

  searchTerm = '';
  selectedWebsite = 'ALL';
  selectedStatus = 'ALL';
  selectedMovementType = 'ALL';
  selectedMargin = 'ALL';
  selectedPercentage = 'ALL';
  selectedCategory = 'ALL';
  sortBy = 'MARGIN_DESC';

  totalProductsCount = 0;
  profitableDealsCount = 0;
  maxProfitAmount = 0;
  totalLinksCount = 0;

  tagCounts = {
    cardToCash: 0,
    loot10: 0,
    loot510: 0,
    profit: 0,
    aboveTarget: 0,
    pending: 0,
  };

  websiteStats: { name: string; count: number }[] = [];
  categories: string[] = ['Mobile', 'Electronic', 'Accessories', 'Laptop', 'Others'];
  movementTypes: string[] = ['Fast Move', 'Average Move', 'Slow Movement'];

  activeOfferLink: ProductLink | null = null;
  activeOfferProduct: MasterProduct | null = null;
  isOfferModalOpen = false;
  isMobileFiltersOpen = false;

  constructor(
    private dealService: DealRadarService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  toggleMobileFilters(): void {
    this.isMobileFiltersOpen = !this.isMobileFiltersOpen;
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.selectedWebsite !== 'ALL') count++;
    if (this.selectedStatus !== 'ALL') count++;
    if (this.selectedMovementType !== 'ALL') count++;
    if (this.selectedMargin !== 'ALL') count++;
    if (this.selectedPercentage !== 'ALL') count++;
    if (this.selectedCategory !== 'ALL') count++;
    if (this.sortBy !== 'MARGIN_DESC') count++;
    return count;
  }

  loadProducts(): void {
    this.isLoading = true;
    this.dealService.getProducts().subscribe({
      next: (res) => {
        this.products = res || [];
        this.lastRefreshedAtIst = this.getNowIstString();
        this.computeStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading products', err);
        this.toastr.error('Failed to load products');
        this.isLoading = false;
      },
    });
  }

  computeStats(): void {
    this.totalProductsCount = this.products.length;
    let profitable = 0;
    let maxMargin = 0;
    let linksCount = 0;
    const siteMap: { [key: string]: number } = {};

    let cardToCash = 0;
    let loot10 = 0;
    let loot510 = 0;
    let profit = 0;
    let aboveTarget = 0;
    let pending = 0;

    this.products.forEach((p) => {
      let productHasProfitable = false;
      (p.links || []).forEach((link) => {
        linksCount++;
        const site = link.websiteName || 'Unknown';
        siteMap[site] = (siteMap[site] || 0) + 1;

        const tag = (link.dealTag || '').toLowerCase();
        if (tag.includes('card to cash') || tag.includes('small profit')) {
          cardToCash++;
        } else if (tag.includes('loot') && tag.includes('10%')) {
          loot10++;
        } else if (tag.includes('loot')) {
          loot510++;
        } else if (tag.includes('profit')) {
          profit++;
        } else if (tag.includes('above target')) {
          aboveTarget++;
        } else {
          pending++;
        }

        if (link.marginAmount && link.marginAmount > 0) {
          productHasProfitable = true;
          if (link.marginAmount > maxMargin) {
            maxMargin = link.marginAmount;
          }
        }
      });
      if (productHasProfitable) profitable++;
    });

    this.profitableDealsCount = profitable;
    this.maxProfitAmount = maxMargin;
    this.totalLinksCount = linksCount;
    this.tagCounts = {
      cardToCash,
      loot10,
      loot510,
      profit,
      aboveTarget,
      pending,
    };

    this.websiteStats = Object.keys(siteMap).map((name) => ({
      name,
      count: siteMap[name],
    })).sort((a, b) => b.count - a.count);
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredProducts = this.products.filter((product) => {
      if (term) {
        const matchesProduct =
          (product.productName && product.productName.toLowerCase().includes(term)) ||
          (product.category && product.category.toLowerCase().includes(term));
        const matchesLink = (product.links || []).some(
          (l) =>
            (l.websiteName && l.websiteName.toLowerCase().includes(term)) ||
            (l.dealTag && l.dealTag.toLowerCase().includes(term)) ||
            (l.cardOfferSummary && l.cardOfferSummary.toLowerCase().includes(term))
        );
        if (!matchesProduct && !matchesLink) return false;
      }

      if (this.selectedCategory !== 'ALL' && product.category !== this.selectedCategory) {
        return false;
      }

      if (this.selectedMovementType !== 'ALL' && product.movementType !== this.selectedMovementType) {
        return false;
      }

      if (this.selectedWebsite !== 'ALL') {
        const hasWebsite = (product.links || []).some(
          (l) => l.websiteName?.toLowerCase() === this.selectedWebsite.toLowerCase()
        );
        if (!hasWebsite) return false;
      }

      if (this.selectedStatus !== 'ALL') {
        const matchesStatus = (product.links || []).some((l) => {
          const tag = (l.dealTag || '').toLowerCase();
          switch (this.selectedStatus) {
            case 'CARD_TO_CASH':
              return tag.includes('card to cash') || tag.includes('small profit');
            case 'LOOT_10':
              return tag.includes('loot') && tag.includes('10%');
            case 'LOOT_5_10':
              return tag.includes('loot') && !tag.includes('10%');
            case 'PROFIT_DEAL':
              return tag.includes('profit deal') || tag.includes('profit');
            case 'ABOVE_TARGET':
              return tag.includes('above target');
            case 'ALERT_DEALS':
              return tag.includes('loot') || tag.includes('profit') || tag.includes('card to cash');
            case 'PENDING':
              return !l.dealTag || !l.lastCheckedAt;
            case 'IN_STOCK':
              return l.isInStock !== false;
            case 'OUT_OF_STOCK':
              return l.isInStock === false;
            default:
              return tag.includes(this.selectedStatus.toLowerCase());
          }
        });
        if (!matchesStatus) return false;
      }

      if (this.selectedMargin !== 'ALL') {
        const minMargin = parseFloat(this.selectedMargin);
        const hasMinMargin = (product.links || []).some(
          (l) => l.marginAmount !== undefined && l.marginAmount !== null && l.marginAmount >= minMargin
        );
        if (!hasMinMargin) return false;
      }

      if (this.selectedPercentage !== 'ALL') {
        const minPct = parseFloat(this.selectedPercentage);
        const hasMinPct = (product.links || []).some(
          (l) => l.marginPercentage !== undefined && l.marginPercentage !== null && l.marginPercentage >= minPct
        );
        if (!hasMinPct) return false;
      }

      return true;
    });

    this.sortFilteredProducts();
  }

  sortFilteredProducts(): void {
    this.filteredProducts.sort((a, b) => {
      const getBestMargin = (p: MasterProduct) =>
        Math.max(0, ...(p.links || []).map((l) => l.marginAmount || 0));
      const getBestPercent = (p: MasterProduct) =>
        Math.max(0, ...(p.links || []).map((l) => l.marginPercentage || 0));
      const getLowestPrice = (p: MasterProduct) =>
        Math.min(99999999, ...(p.links || []).map((l) => l.effectivePrice || 99999999));

      switch (this.sortBy) {
        case 'MARGIN_DESC':
          return getBestMargin(b) - getBestMargin(a);
        case 'PERCENT_DESC':
          return getBestPercent(b) - getBestPercent(a);
        case 'PRICE_ASC':
          return getLowestPrice(a) - getLowestPrice(b);
        case 'NAME_ASC':
          return a.productName.localeCompare(b.productName);
        case 'NEWEST':
          return (b.id || 0) - (a.id || 0);
        default:
          return 0;
      }
    });
  }

  setWebsiteFilter(siteName: string): void {
    this.selectedWebsite = this.selectedWebsite === siteName ? 'ALL' : siteName;
    this.applyFilters();
  }

  setStatusFilter(status: string): void {
    this.selectedStatus = this.selectedStatus === status ? 'ALL' : status;
    this.applyFilters();
  }

  setMovementFilter(type: string): void {
    this.selectedMovementType = this.selectedMovementType === type ? 'ALL' : type;
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedWebsite = 'ALL';
    this.selectedStatus = 'ALL';
    this.selectedMovementType = 'ALL';
    this.selectedMargin = 'ALL';
    this.selectedPercentage = 'ALL';
    this.selectedCategory = 'ALL';
    this.sortBy = 'MARGIN_DESC';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return (
      !!this.searchTerm ||
      this.selectedWebsite !== 'ALL' ||
      this.selectedStatus !== 'ALL' ||
      this.selectedMovementType !== 'ALL' ||
      this.selectedMargin !== 'ALL' ||
      this.selectedPercentage !== 'ALL' ||
      this.selectedCategory !== 'ALL' ||
      this.sortBy !== 'MARGIN_DESC'
    );
  }

  getVisibleLinks(product: MasterProduct): ProductLink[] {
    if (!product.links) return [];
    if (this.selectedWebsite === 'ALL') return product.links;
    return product.links.filter(
      (l) => l.websiteName?.toLowerCase() === this.selectedWebsite.toLowerCase()
    );
  }

  checkPrice(id: number): void {
    if (this.isChecking[id]) return;
    this.isChecking[id] = true;
    this.toastr.info('Checking prices across all stores...');
    this.dealService.checkPrices(id).subscribe({
      next: (res) => {
        this.toastr.success(res?.message || 'Prices checked successfully!');
        this.isChecking[id] = false;
        this.loadProducts();
      },
      error: (err) => {
        this.toastr.error('Error checking prices');
        this.isChecking[id] = false;
      },
    });
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure you want to delete this product and all associated tracking links?')) {
      this.dealService.deleteProduct(id).subscribe({
        next: () => {
          this.toastr.success('Product deleted');
          this.loadProducts();
        },
        error: () => this.toastr.error('Failed to delete product'),
      });
    }
  }

  copyAffiliateUrl(url: string | undefined): void {
    if (!url) {
      this.toastr.warning('No affiliate URL specified for this link');
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      this.toastr.success('Affiliate URL copied to clipboard!');
    }).catch(() => {
      this.toastr.info('URL: ' + url);
    });
  }

  openOfferModal(product: MasterProduct, link: ProductLink): void {
    this.activeOfferProduct = product;
    this.activeOfferLink = link;
    this.isOfferModalOpen = true;
  }

  closeOfferModal(): void {
    this.isOfferModalOpen = false;
    this.activeOfferProduct = null;
    this.activeOfferLink = null;
  }

  parseOffers(summary: string | undefined): string[] {
    if (!summary) return [];
    return summary.split('|').map((s) => s.trim()).filter((s) => s.length > 0);
  }

  formatIstTime(dateStr: string | undefined): string {
    if (!dateStr) return 'Never checked';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date) + ' IST';
  }

  formatTimeAgo(dateStr: string | undefined): string {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
    }).format(date);
  }

  getNowIstString(): string {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date()) + ' IST';
  }

  getDealTagBadgeInfo(dealTag: string | undefined): { text: string; cssClass: string; icon: string; isCardToCash: boolean } {
    if (!dealTag) {
      return { text: '⏳ Pending Scan', cssClass: 'badge-pending', icon: 'bi-hourglass-split', isCardToCash: false };
    }
    const tag = dealTag.toLowerCase();
    if (tag.includes('card to cash') || tag.includes('small profit')) {
      return { text: '💳 CARD TO CASH (Small Profit)', cssClass: 'badge-card-cash', icon: 'bi-credit-card-2-front-fill', isCardToCash: true };
    }
    if (tag.includes('loot') && tag.includes('10%')) {
      return { text: '💥 LOOT DEAL (10%+ Profit)', cssClass: 'badge-loot-super', icon: 'bi-fire', isCardToCash: false };
    }
    if (tag.includes('loot')) {
      return { text: '🔥 LOOT DEAL', cssClass: 'badge-loot', icon: 'bi-lightning-charge-fill', isCardToCash: false };
    }
    if (tag.includes('profit')) {
      return { text: '💰 PROFIT DEAL', cssClass: 'badge-profit', icon: 'bi-cash-coin', isCardToCash: false };
    }
    if (tag.includes('above target')) {
      return { text: '❌ Above Target Price', cssClass: 'badge-above-target', icon: 'bi-x-circle', isCardToCash: false };
    }
    return { text: dealTag, cssClass: 'bg-secondary text-white', icon: 'bi-tag', isCardToCash: false };
  }

  getWebsiteBadgeColor(websiteName: string | undefined): { bg: string; text: string; icon: string } {
    const site = (websiteName || '').toLowerCase();
    if (site.includes('amazon')) {
      return { bg: '#ff9900', text: '#000000', icon: 'bi-box-seam' };
    } else if (site.includes('flipkart')) {
      return { bg: '#2874f0', text: '#ffffff', icon: 'bi-lightning-charge' };
    } else if (site.includes('croma')) {
      return { bg: '#00b894', text: '#ffffff', icon: 'bi-tv' };
    } else if (site.includes('reliance')) {
      return { bg: '#e42529', text: '#ffffff', icon: 'bi-phone' };
    } else if (site.includes('myntra')) {
      return { bg: '#ff3f6c', text: '#ffffff', icon: 'bi-bag-heart' };
    } else if (site.includes('tata')) {
      return { bg: '#673ab7', text: '#ffffff', icon: 'bi-gem' };
    } else if (site.includes('swiggy')) {
      return { bg: '#fc8019', text: '#ffffff', icon: 'bi-cart' };
    } else if (site.includes('big basket') || site.includes('bigbasket')) {
      return { bg: '#689f38', text: '#ffffff', icon: 'bi-basket' };
    } else if (site.includes('ajio')) {
      return { bg: '#2c4152', text: '#ffffff', icon: 'bi-handbag' };
    } else if (site.includes('vijay')) {
      return { bg: '#c0392b', text: '#ffffff', icon: 'bi-shop' };
    } else if (site.includes('jio')) {
      return { bg: '#0a3d62', text: '#ffffff', icon: 'bi-cart-check' };
    }
    return { bg: '#475569', text: '#ffffff', icon: 'bi-globe' };
  }
}
