export interface MasterProduct {
    id: number;
    productName: string;
    category: string;
    targetPrice: number;
    movementType: string;
    isActive: boolean;
    createdAt: string;
    links: ProductLink[];
}

export interface ProductLink {
    id?: number;
    masterProductId?: number;
    websiteName: string;
    productUrl: string;
    currentPrice?: number;
    couponDiscount?: number;
    maxCardDiscount?: number;
    effectivePrice?: number;
    cardOfferSummary?: string;
    marginAmount?: number;
    marginPercentage?: number;
    dealTag?: string;
    lastAlertedPrice?: number;
    isInStock?: boolean;
    lastCheckedAt?: string;
}

export interface CreateMasterProductDto {
    productName: string;
    category: string;
    targetPrice: number;
    movementType: string;
    links: CreateProductLinkDto[];
}

export interface CreateProductLinkDto {
    websiteName: string;
    productUrl: string;
}
