import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { SearchFilters } from "@/components/SearchFilters";
import { BusinessResults } from "@/components/BusinessResults";
import { Search as SearchIcon, MapPin, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Search = () => {
  const [searchType, setSearchType] = useState<"url" | "location">("url");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (searchType === "url" && !url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid website URL",
        variant: "destructive"
      });
      return;
    }
    
    if (searchType === "location" && !location.trim()) {
      toast({
        title: "Location Required", 
        description: "Please enter a location to search",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
      setShowResults(true);
      toast({
        title: "Search Complete",
        description: `Found businesses ${searchType === "url" ? "for the provided URL" : `in ${location}`}`,
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Business Intelligence Search
            </h1>
            <p className="text-xl text-muted-foreground">
              Analyze individual businesses or discover opportunities in specific locations
            </p>
          </div>

          {/* Search Type Selection */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Search Method</CardTitle>
              <CardDescription>
                Choose how you want to search for businesses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Button
                  variant={searchType === "url" ? "default" : "outline"}
                  onClick={() => setSearchType("url")}
                  className="flex-1"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Specific Business URL
                </Button>
                <Button
                  variant={searchType === "location" ? "default" : "outline"}
                  onClick={() => setSearchType("location")}
                  className="flex-1"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Geographic Location
                </Button>
              </div>

              {searchType === "url" ? (
                <div className="space-y-4">
                  <Input
                    placeholder="https://example.com or social media profile"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="text-lg py-3"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter a website URL or social media profile to analyze a specific business
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="San Francisco, CA or specific address"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="text-lg py-3"
                    />
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger className="text-lg py-3">
                        <SelectValue placeholder="Industry (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurants">Restaurants</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="services">Professional Services</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                        <SelectItem value="fitness">Fitness & Sports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Search for businesses in a specific area, optionally filtered by industry
                  </p>
                </div>
              )}

              <Button 
                onClick={handleSearch}
                disabled={isSearching}
                size="lg"
                className="w-full btn-hero"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Businesses...
                  </>
                ) : (
                  <>
                    <SearchIcon className="h-5 w-5 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Search Filters */}
          {showResults && <SearchFilters />}

          {/* Results */}
          {showResults && <BusinessResults searchType={searchType} query={searchType === "url" ? url : location} />}
        </div>
      </div>
    </div>
  );
};

export default Search;