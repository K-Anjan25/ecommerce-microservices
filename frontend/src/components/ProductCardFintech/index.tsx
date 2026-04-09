import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { ProductApi } from "../../api/productApi";
import { CommentApi } from "../../api/comment";
import { showSuccess } from "../../utils/showSuccess";
import { CreateCommentRequest } from "../../types/comment";
import { ProductAdmin, Product } from "../../types/product";
import { cn, formatPrice } from "../../lib/utils";

// Shadcn/UI Components
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";

// Icons
import { ShoppingCart, Heart, Star, MessageCircle, Send, Package, TrendingUp } from "lucide-react";

type ProductCardFintechProps = {
  product: ProductAdmin | Product | undefined;
  variant?: "default" | "compact" | "featured";
  onAddToCart?: (product: ProductAdmin | Product) => void;
  showComments?: boolean;
  className?: string;
};

const ProductCardFintech = ({
  product,
  variant = "default",
  onAddToCart,
  showComments = false,
  className,
}: ProductCardFintechProps) => {
  const { productId } = useParams();
  const queryClient = useQueryClient();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);

  // Fetch comments if needed - Maintaining your existing API integration
  const {
    data: comments,
    isLoading: commentsLoading,
    isError: commentsError,
  } = useQuery(
    ["products:comments", productId],
    () => ProductApi.getCommentsByProductId(productId ?? ""),
    { enabled: showComments && !!productId }
  );

  // Create comment mutation - Maintaining your existing API integration
  const createMutation = useMutation(CommentApi.saveComment, {
    onSuccess: () => {
      showSuccess("Comment has been created successfully");
      queryClient.invalidateQueries("products:comments");
      setCommentText("");
    },
  });

  const handleCreateComment = () => {
    if (!commentText.trim() || !productId) return;
    const commentRequest = {
      productId,
      text: commentText,
    } as CreateCommentRequest;
    createMutation.mutate(commentRequest);
  };

  const handleAddToCart = () => {
    if (product && onAddToCart) {
      onAddToCart(product);
    }
  };

  if (!product) {
    return (
      <Card className={cn("overflow-hidden animate-pulse", className)}>
        <div className="aspect-[4/3] bg-muted" />
        <CardContent className="p-5">
          <div className="h-6 bg-muted rounded mb-2 w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </CardContent>
      </Card>
    );
  }

  // Compact variant for grid displays
  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "group overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer",
          className
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {!imageLoaded && <div className="absolute inset-0 skeleton-fintech" />}
          <img
            src={product.imageUrl}
            alt={product.name}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick Actions Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              className="bg-white/90 text-foreground hover:bg-white"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsWishlisted(!isWishlisted);
              }}
              className="bg-white/90 hover:bg-white"
            >
              <Heart
                className={cn("h-4 w-4", isWishlisted ? "fill-red-500 text-red-500" : "text-foreground")}
              />
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground truncate mb-3">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-bold text-primary">{formatPrice(product.unitPrice)}</span>
            <Badge variant="info" className="text-[10px]">
              <TrendingUp className="h-3 w-3 mr-1" />
              In Stock
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Featured variant for highlighted products
  if (variant === "featured") {
    return (
      <Card
        className={cn(
          "group overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 transition-all duration-300 hover:shadow-card-hover hover:border-primary/40",
          className
        )}
      >
        <div className="flex flex-col lg:flex-row">
          <div className="relative lg:w-1/2 aspect-[4/3] lg:aspect-auto overflow-hidden bg-muted">
            <Badge className="absolute top-4 left-4 z-10 bg-primary text-primary-foreground">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured
            </Badge>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="lg:w-1/2 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">{product.name}</h3>
              <p className="text-muted-foreground mb-4 line-clamp-3">{product.description}</p>
              {"categoryName" in product && (
                <Badge variant="outline" className="mb-4">
                  <Package className="h-3 w-3 mr-1" />
                  {product.categoryName}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-3xl font-bold text-primary">{formatPrice(product.unitPrice)}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setIsWishlisted(!isWishlisted)}>
                  <Heart className={cn("h-5 w-5", isWishlisted ? "fill-red-500 text-red-500" : "")} />
                </Button>
                <Button onClick={handleAddToCart} className="gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Default full variant with comments
  return (
    <Card className={cn("overflow-hidden transition-all duration-300", className)}>
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="bg-white/90 hover:bg-white"
          >
            <Heart className={cn("h-5 w-5", isWishlisted ? "fill-red-500 text-red-500" : "")} />
          </Button>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
            {"categoryName" in product && product.categoryName && (
              <Badge variant="outline">
                <Package className="h-3 w-3 mr-1" />
                {product.categoryName}
              </Badge>
            )}
          </div>
          <div className="text-right">
            <span className="font-mono text-3xl font-bold text-primary">{formatPrice(product.unitPrice)}</span>
            <p className="text-sm text-muted-foreground">incl. all taxes</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">{product.description}</p>

        <div className="flex items-center gap-4">
          <Badge variant="success">
            <Package className="h-3 w-3 mr-1" />
            In Stock
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span>4.8 (120 reviews)</span>
          </div>
        </div>

        {onAddToCart && (
          <Button onClick={handleAddToCart} size="lg" className="w-full gap-2">
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </Button>
        )}
      </CardContent>

      {/* Comments Section - Maintaining your existing comments integration */}
      {showComments && (
        <CardFooter className="flex-col border-t border-border pt-6">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">
                Comments {comments && `(${comments.length})`}
              </h3>
            </div>

            {/* Add Comment */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="input-fintech flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleCreateComment()}
              />
              <Button
                onClick={handleCreateComment}
                disabled={!commentText.trim() || createMutation.isLoading}
                loading={createMutation.isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments List */}
            {commentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : commentsError ? (
              <p className="text-sm text-destructive">Failed to load comments</p>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-fintech">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="border-b border-border pb-3 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {comment.user?.firstName || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default ProductCardFintech;
