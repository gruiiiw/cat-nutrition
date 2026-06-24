'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BrandOption {
  id: number;
  name: string;
}

export default function QuickSearch() {
  const router = useRouter();
  const [foodType, setFoodType] = useState<'wet' | 'dry' | 'both'>('both');
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [proteinRange, setProteinRange] = useState<number[]>([30, 60]);
  const [brandsOpen, setBrandsOpen] = useState(false);

  useEffect(() => {
    fetch('/api/brands')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBrands(data);
        }
      })
      .catch(() => {
        // API might not be available yet
      });
  }, []);

  const toggleBrand = (brandId: number) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId],
    );
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (foodType !== 'both') params.set('foodType', foodType);
    if (selectedBrands.length > 0)
      params.set('brandIds', selectedBrands.join(','));
    if (proteinRange[0] > 0)
      params.set('minProteinDmb', proteinRange[0].toString());
    if (proteinRange[1] < 100)
      params.set('maxProteinDmb', proteinRange[1].toString());

    router.push(`/browse?${params.toString()}`);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Quick Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Food Type Toggle */}
        <div className="space-y-2">
          <Label>Food Type</Label>
          <RadioGroup
            value={foodType}
            onValueChange={(val) => setFoodType(val as 'wet' | 'dry' | 'both')}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="wet" id="qs-wet" />
              <Label htmlFor="qs-wet">Wet</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="dry" id="qs-dry" />
              <Label htmlFor="qs-dry">Dry</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="both" id="qs-both" />
              <Label htmlFor="qs-both">Both</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Brand Multi-Select */}
        <div className="space-y-2">
          <Label>Brands</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setBrandsOpen(!brandsOpen)}
              className="flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <span className="text-muted-foreground">
                {selectedBrands.length > 0
                  ? `${selectedBrands.length} brand${selectedBrands.length > 1 ? 's' : ''} selected`
                  : 'All brands'}
              </span>
              <span className="text-xs">
                {brandsOpen ? '▲' : '▼'}
              </span>
            </button>
            {brandsOpen && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-popover p-2 shadow-md">
                {brands.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">
                    Loading brands...
                  </p>
                ) : (
                  brands.map((brand) => (
                    <label
                      key={brand.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand.id)}
                        onChange={() => toggleBrand(brand.id)}
                        className="rounded"
                      />
                      {brand.name}
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Protein Range */}
        <div className="space-y-2">
          <Label>
            Protein Range (DMB): {proteinRange[0]}% - {proteinRange[1]}%
          </Label>
          <Slider
            value={proteinRange}
            onValueChange={setProteinRange}
            min={0}
            max={70}
            step={5}
          />
        </div>

        <Button onClick={handleSearch} className="w-full">
          Search
        </Button>
      </CardContent>
    </Card>
  );
}
