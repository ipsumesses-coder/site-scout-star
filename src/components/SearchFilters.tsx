import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Filter, RotateCcw } from "lucide-react";
import { useState } from "react";

export const SearchFilters = () => {
  const [seoRange, setSeoRange] = useState([0, 100]);
  const [designRange, setDesignRange] = useState([0, 100]);
  const [brandingRange, setBrandingRange] = useState([0, 100]);
  const [sortBy, setSortBy] = useState("");

  const resetFilters = () => {
    setSeoRange([0, 100]);
    setDesignRange([0, 100]);
    setBrandingRange([0, 100]);
    setSortBy("");
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters & Sorting
            </CardTitle>
            <CardDescription>
              Filter results by score ranges and sort by performance metrics
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* SEO Score Filter */}
          <div className="space-y-2">
            <Label>SEO Score Range</Label>
            <Slider
              value={seoRange}
              onValueChange={setSeoRange}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{seoRange[0]}</span>
              <span>{seoRange[1]}</span>
            </div>
          </div>

          {/* Design Score Filter */}
          <div className="space-y-2">
            <Label>Design Score Range</Label>
            <Slider
              value={designRange}
              onValueChange={setDesignRange}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{designRange[0]}</span>
              <span>{designRange[1]}</span>
            </div>
          </div>

          {/* Branding Score Filter */}
          <div className="space-y-2">
            <Label>Branding Score Range</Label>
            <Slider
              value={brandingRange}
              onValueChange={setBrandingRange}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{brandingRange[0]}</span>
              <span>{brandingRange[1]}</span>
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Choose sorting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seo-desc">SEO Score (High to Low)</SelectItem>
                <SelectItem value="seo-asc">SEO Score (Low to High)</SelectItem>
                <SelectItem value="design-desc">Design Score (High to Low)</SelectItem>
                <SelectItem value="design-asc">Design Score (Low to High)</SelectItem>
                <SelectItem value="branding-desc">Branding Score (High to Low)</SelectItem>
                <SelectItem value="branding-asc">Branding Score (Low to High)</SelectItem>
                <SelectItem value="overall-desc">Overall Score (High to Low)</SelectItem>
                <SelectItem value="overall-asc">Overall Score (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};