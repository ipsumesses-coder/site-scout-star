import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { SearchFilters } from "@/components/SearchFilters";
import { BusinessResults } from "@/components/BusinessResults";
import { Search as SearchIcon, MapPin, Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const UK_COUNTIES = [
  // England
  "Bedfordshire", "Berkshire", "Bristol", "Buckinghamshire", "Cambridgeshire", "Cheshire", 
  "City of London", "Cornwall", "Cumbria", "Derbyshire", "Devon", "Dorset", "Durham", 
  "East Riding of Yorkshire", "East Sussex", "Essex", "Gloucestershire", "Greater London", 
  "Greater Manchester", "Hampshire", "Herefordshire", "Hertfordshire", "Isle of Wight", 
  "Kent", "Lancashire", "Leicestershire", "Lincolnshire", "Merseyside", "Norfolk", 
  "North Yorkshire", "Northamptonshire", "Northumberland", "Nottinghamshire", "Oxfordshire", 
  "Rutland", "Shropshire", "Somerset", "South Yorkshire", "Staffordshire", "Suffolk", 
  "Surrey", "Tyne and Wear", "Warwickshire", "West Midlands", "West Sussex", "West Yorkshire", 
  "Wiltshire", "Worcestershire",
  // Wales
  "Blaenau Gwent", "Bridgend", "Caerphilly", "Cardiff", "Carmarthenshire", "Ceredigion", 
  "Conwy", "Denbighshire", "Flintshire", "Gwynedd", "Isle of Anglesey", "Merthyr Tydfil", 
  "Monmouthshire", "Neath Port Talbot", "Newport", "Pembrokeshire", "Powys", 
  "Rhondda Cynon Taf", "Swansea", "Torfaen", "Vale of Glamorgan", "Wrexham",
  // Scotland
  "Aberdeen City", "Aberdeenshire", "Angus", "Argyll and Bute", "Clackmannanshire", 
  "Dumfries and Galloway", "Dundee City", "East Ayrshire", "East Dunbartonshire", 
  "East Lothian", "East Renfrewshire", "Edinburgh", "Falkirk", "Fife", "Glasgow City", 
  "Highland", "Inverclyde", "Midlothian", "Moray", "North Ayrshire", "North Lanarkshire", 
  "Orkney Islands", "Perth and Kinross", "Renfrewshire", "Scottish Borders", 
  "Shetland Islands", "South Ayrshire", "South Lanarkshire", "Stirling", 
  "West Dunbartonshire", "West Lothian", "Western Isles",
  // Northern Ireland
  "Antrim and Newtownabbey", "Ards and North Down", "Armagh City", "Banbridge and Craigavon", 
  "Belfast", "Causeway Coast and Glens", "Derry City and Strabane", "Fermanagh and Omagh", 
  "Lisburn and Castlereagh", "Mid and East Antrim", "Mid Ulster", "Newry, Mourne and Down"
];

const US_CITIES = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ", 
  "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA", 
  "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC", 
  "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC", 
  "Boston, MA", "El Paso, TX", "Nashville, TN", "Detroit, MI", "Oklahoma City, OK", 
  "Portland, OR", "Las Vegas, NV", "Memphis, TN", "Louisville, KY", "Baltimore, MD", 
  "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ", "Fresno, CA", "Mesa, AZ", 
  "Sacramento, CA", "Atlanta, GA", "Kansas City, MO", "Colorado Springs, CO", "Omaha, NE", 
  "Raleigh, NC", "Miami, FL", "Long Beach, CA", "Virginia Beach, VA", "Oakland, CA", 
  "Minneapolis, MN", "Tulsa, OK", "Tampa, FL", "Arlington, TX", "New Orleans, LA"
];

const Search = () => {
  const [searchType, setSearchType] = useState<"url" | "location">("url");
  const [url, setUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [country, setCountry] = useState<"UK" | "US">("US");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [customBusinessType, setCustomBusinessType] = useState("");
  const [postcode, setPostcode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchQueryId, setSearchQueryId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [showMaxResultsDialog, setShowMaxResultsDialog] = useState(false);
  const [maxResults, setMaxResults] = useState<number>(5);
  const [loadMoreAmount, setLoadMoreAmount] = useState<number>(10);
  const [pendingSearch, setPendingSearch] = useState<boolean>(false);
  const { toast } = useToast();

  const initiateSearch = () => {
    if (searchType === "url" && !url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid website URL",
        variant: "destructive"
      });
      return;
    }
    
    if (searchType === "location" && !postcode.trim() && !location.trim()) {
      toast({
        title: "Location Required", 
        description: "Please enter a postcode/zip code or select a location",
        variant: "destructive"
      });
      return;
    }

    // URL search: analyze directly without asking for max results
    if (searchType === "url") {
      handleSearch(false);
      return;
    }

    // Location search: show max results dialog
    setShowMaxResultsDialog(true);
    setPendingSearch(true);
  };

  const handleSearch = async (loadMore = false) => {
    const currentOffset = loadMore ? offset : 0;
    if (!loadMore) {
      setOffset(0);
      setShowResults(false);
    }

    setIsSearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('business-discovery', {
        body: {
          query_type: searchType,
          location: searchType === "location" ? (postcode.trim() || location) : undefined,
          url: searchType === "url" ? url : undefined,
          social_media_urls: searchType === "url" ? {
            twitter: twitterUrl.trim() || undefined,
            facebook: facebookUrl.trim() || undefined,
            instagram: instagramUrl.trim() || undefined,
            linkedin: linkedinUrl.trim() || undefined,
          } : undefined,
          industry: searchType === "location" ? (customBusinessType.trim() || (industry && industry.trim() !== '' ? industry : undefined)) : undefined,
          radius: 25,
          offset: currentOffset,
          max_results: searchType === "url" ? 1 : (loadMore ? undefined : maxResults)
        }
      });

      if (error) throw error;

      if (data.success) {
        setSearchQueryId(data.search_query_id);
        setShowResults(true);
        if (loadMore) {
          setOffset(currentOffset + loadMoreAmount);
        }
        toast({
          title: "Search Complete",
          description: `Found ${data.businesses_found} businesses${data.from_cache ? ' (cached)' : ''}`,
        });
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to search for businesses",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const confirmMaxResults = () => {
    setShowMaxResultsDialog(false);
    setPendingSearch(false);
    handleSearch(false);
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
                  <div className="space-y-2">
                    <Label htmlFor="website-url" className="text-sm font-medium">Website URL *</Label>
                    <Input
                      id="website-url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="text-lg py-3"
                    />
                  </div>
                  
                  <div className="pt-2 pb-1">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Social Media Profiles (Optional - for branding consistency analysis)
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="twitter-url" className="text-xs text-muted-foreground">Twitter/X</Label>
                      <Input
                        id="twitter-url"
                        placeholder="https://twitter.com/username"
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                        className="py-2"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="facebook-url" className="text-xs text-muted-foreground">Facebook</Label>
                      <Input
                        id="facebook-url"
                        placeholder="https://facebook.com/page"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        className="py-2"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="instagram-url" className="text-xs text-muted-foreground">Instagram</Label>
                      <Input
                        id="instagram-url"
                        placeholder="https://instagram.com/username"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        className="py-2"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="linkedin-url" className="text-xs text-muted-foreground">LinkedIn</Label>
                      <Input
                        id="linkedin-url"
                        placeholder="https://linkedin.com/company/name"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="py-2"
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground pt-2">
                    Add social media profiles to analyze branding consistency across platforms
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={country} onValueChange={(value) => {
                      setCountry(value as "UK" | "US");
                      setLocation("");
                    }}>
                      <SelectTrigger className="text-lg py-3">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      type="text"
                      placeholder={country === "UK" ? "Enter postcode (e.g., SW1A 1AA)" : "Enter zip code (e.g., 10001)"}
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      className="text-lg py-3"
                    />
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>OR</span>
                    </div>
                    
                    <Select value={location} onValueChange={setLocation} disabled={!!postcode.trim()}>
                      <SelectTrigger className="text-lg py-3">
                        <SelectValue placeholder={country === "UK" ? "Select County" : "Select City"} />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50 max-h-[300px]">
                        {(country === "UK" ? UK_COUNTIES : US_CITIES).map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Input
                    type="text"
                    placeholder="Search for specific business type (e.g., accountants, plumbers)"
                    value={customBusinessType}
                    onChange={(e) => setCustomBusinessType(e.target.value)}
                    className="text-lg py-3"
                  />
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>OR</span>
                  </div>
                  
                  <Select value={industry} onValueChange={setIndustry} disabled={!!customBusinessType.trim()}>
                    <SelectTrigger className="text-lg py-3">
                      <SelectValue placeholder="Select Industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="restaurant">Restaurants</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="professional services">Professional Services</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="real estate">Real Estate</SelectItem>
                      <SelectItem value="fitness">Fitness & Sports</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <p className="text-sm text-muted-foreground">
                    Enter a postcode/zip code or select a location, then optionally specify a business type or industry
                  </p>
                </div>
              )}

              <Button
                onClick={initiateSearch}
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
          {showResults && searchQueryId && (
            <BusinessResults 
              searchQueryId={searchQueryId}
              onLoadMore={() => handleSearch(true)}
              isLoadingMore={isSearching}
              analysisLimit={maxResults}
              loadMoreAmount={loadMoreAmount}
              onLoadMoreAmountChange={setLoadMoreAmount}
            />
          )}
        </div>
      </div>

      {/* Max Results Dialog */}
      <Dialog open={showMaxResultsDialog} onOpenChange={setShowMaxResultsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Search & Analysis Limit</DialogTitle>
            <DialogDescription>
              Limit both the number of businesses fetched from Google Places AND automatically analyzed to save tokens.
              Results are cached for 30 days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="max-results">Max Results:</Label>
              <Input
                id="max-results"
                type="number"
                min={1}
                max={50}
                value={maxResults}
                onChange={(e) => setMaxResults(Math.max(1, Math.min(50, parseInt(e.target.value) || 5)))}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                Set between 1-50 businesses. Lower numbers save API tokens.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMaxResultsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmMaxResults}>
              Continue Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Search;