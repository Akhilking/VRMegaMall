import React, { useState, useEffect, useRef } from "react";
import {
    Box, List, ListItem, ListItemButton, ListItemAvatar,
    Avatar, ListItemText, Typography, IconButton,
    InputBase, Paper, Divider, Button, Badge, Tab, Tabs,
    Fab, Tooltip,
    Chip,
    Card,
    LinearProgress
} from "@mui/material";
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import {
    Search, ShoppingBag, Inventory, Store,
    AddShoppingCart, ChevronLeft, ChevronRight, CheckCircle, Info, Analytics,
    ThumbUp, ThumbDown, Water, Whatshot, AcUnit, Star, Checkroom
} from "@mui/icons-material";
import { MallComponent } from "../MallComponent";
import { Color3 } from "@babylonjs/core/Maths/math";
import Grid from '@mui/material/Grid';


// Sample product data
const products = [
    {
        id: "tshirt_red",
        name: "Red Cotton Tee",
        image: "assets/images/tshirt.jpg",
        price: "$24.99",
        description: "Comfortable 100% cotton t-shirt for everyday wear",
        color: "Red",
        material: "100% Cotton"
    },
    {
        id: "tshirt_blue",
        name: "Blue Cotton Tee",
        image: "assets/images/tshirt.jpg",
        price: "$24.99",
        description: "Comfortable 100% cotton t-shirt for everyday wear",
        color: "Blue",
        material: "100% Cotton"
    },
    {
        id: "tshirt_black",
        name: "Black Cotton Tee",
        image: "assets/images/tshirt.jpg",
        price: "$24.99",
        description: "Comfortable 100% cotton t-shirt for everyday wear",
        color: "Black",
        material: "100% Cotton"
    },
    {
        id: "tshirt_green",
        name: "Green V-Neck Tee",
        image: "assets/images/tshirt.jpg",
        price: "$27.99",
        description: "Stylish v-neck t-shirt for casual outings",
        color: "Green",
        material: "95% Cotton, 5% Elastane"
    },
    {
        id: "tshirt_yellow",
        name: "Yellow Summer Tee",
        image: "assets/images/tshirt.jpg",
        price: "$22.99",
        description: "Bright summer t-shirt with breathable fabric",
        color: "Yellow",
        material: "100% Cotton"
    }
];

// Sample inventory data (these would normally come from a user profile/database)
const inventoryItems = [
    {
        id: "tshirt_white",
        name: "White Basic Tee",
        image: "assets/images/tshirt.jpg",
        purchaseDate: "2025-08-15",
        color: "White",
        material: "100% Cotton",
        wearCount: 5
    },
    {
        id: "tshirt_navy",
        name: "Navy Blue Polo",
        image: "assets/images/tshirt.jpg",
        purchaseDate: "2025-07-22",
        color: "Navy",
        material: "95% Cotton, 5% Elastane",
        wearCount: 3
    }
];

interface MainProductLayoutProps {
    mallComponent: MallComponent;
}

export const MainProductLayout: React.FC<MainProductLayoutProps> = ({
    mallComponent
}) => {
    const [activeTab, setActiveTab] = useState<number>(0);
    const [selectedProduct, setSelectedProduct] = useState(products[0]);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState(inventoryItems[0]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredProducts, setFilteredProducts] = useState(products);
    const [filteredInventory, setFilteredInventory] = useState(inventoryItems);
    const [isExpanded, setIsExpanded] = useState(false);

    // Add these state variables
    const [masterPanelWidth, setMasterPanelWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const masterPanelRef = useRef<HTMLDivElement>(null);
    const viewerContainerRef = useRef<HTMLDivElement>(null);
    const initialXRef = useRef<number>(0);
    const initialWidthRef = useRef<number>(0);
    const initialYRef = useRef<number>(0);
    const initialBottomHeightRef = useRef<number>(0);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(320);
    const [isResizingBottom, setIsResizingBottom] = useState(false);

    // Calculate sidebar width based on expansion state
    const sidebarWidth = isExpanded ? '30%' : '300px';

    // Filter products when search term changes
    useEffect(() => {
        if (activeTab === 0) {
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.color.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            const filtered = inventoryItems.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.color.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredInventory(filtered);
        }
    }, [searchTerm, activeTab]);



    const handleProductSelect = (product: any) => {
        setSelectedProduct(product);

        // Change the shirt color in Babylon scene based on the selected product
        const color = product.color.toLowerCase();
        applyColorToModel(color);
    };

    const handleInventorySelect = (item: any) => {
        setSelectedInventoryItem(item);

        // Change the shirt color for inventory item too
        const color = item.color.toLowerCase();
        applyColorToModel(color);
    };

    const applyColorToModel = (color: string) => {
        switch (color) {
            case 'red':
                mallComponent.applyCottonMaterial(new Color3(1, 0, 0));
                break;
            case 'blue':
                mallComponent.applyCottonMaterial(new Color3(0, 0, 1));
                break;
            case 'black':
                mallComponent.applyCottonMaterial(new Color3(0.1, 0.1, 0.1));
                break;
            case 'green':
                mallComponent.applyCottonMaterial(new Color3(0.1, 0.7, 0.1));
                break;
            case 'yellow':
                mallComponent.applyCottonMaterial(new Color3(1, 0.9, 0.1));
                break;
            case 'navy':
                mallComponent.applyCottonMaterial(new Color3(0.05, 0.05, 0.3));
                break;
            default:
                mallComponent.applyCottonMaterial(new Color3(1, 1, 1));
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        setSearchTerm(""); // Clear search when switching tabs
    };

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };

    const addToCart = (product: any) => {
        console.log(`Added ${product.name} to cart`);
        // Implement your cart logic here
    };

    // Add this function to handle resize start
    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        initialXRef.current = e.clientX;
        initialWidthRef.current = masterPanelWidth;
        setIsResizing(true);
    };

    const wearItem = (item: any) => {
        console.log(`Now wearing ${item.name}`);
        // Implement your wear logic here

        // Optional visual feedback
        // enqueueSnackbar(`Now wearing ${item.name}`, {
        //     variant: 'success',
        //     anchorOrigin: { vertical: 'top', horizontal: 'center' }
        // });
    };

    // Add these state variables to your MainProductLayout component
    const [bottomTabValue, setBottomTabValue] = useState('analysis');
    const [selectedEffect, setSelectedEffect] = useState<string>('original');
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

    // Add this handler function
    const handleBottomTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setBottomTabValue(newValue);
    };

    const handleBottomResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        initialYRef.current = e.clientY;
        initialBottomHeightRef.current = bottomPanelHeight;
        setIsResizingBottom(true);
    };


    // Add these effect result objects - copied from ProductReviewPanel
    const effectResults = [
        {
            condition: 'Wet Weather',
            icon: <Water />,
            color: 'primary',
            overallScore: 6,
            pros: [
                'Cotton absorbs moisture naturally',
                'Stays soft when wet',
                'No synthetic feel'
            ],
            cons: [
                'Takes long time to dry (2-3 hours)',
                'Becomes heavy when wet',
                'May shrink slightly'
            ],
            simpleRecommendation: 'Okay for light rain, not great for heavy rain.',
            suitability: 'Fair'
        },
        {
            condition: 'Hot Weather',
            icon: <Whatshot />,
            color: 'error',
            overallScore: 9,
            pros: [
                'Excellent breathability keeps you cool',
                'Natural fibers prevent overheating',
                'Absorbs sweat effectively',
                'No unpleasant odors'
            ],
            cons: [
                'Light colors show sweat stains',
                'May wrinkle in heat'
            ],
            simpleRecommendation: 'Perfect choice for hot summer days!',
            suitability: 'Excellent'
        },
        {
            condition: 'Cold Weather',
            icon: <AcUnit />,
            color: 'info',
            overallScore: 4,
            pros: [
                'Good as a base layer',
                'Comfortable against skin',
                'Works well under jackets'
            ],
            cons: [
                'Provides little warmth alone',
                'No wind protection',
                'Cotton loses insulation when wet'
            ],
            simpleRecommendation: 'Not suitable for cold weather alone. Layer with warm clothes.',
            suitability: 'Poor'
        }
    ];

    // Add these feature objects - copied from ProductReviewPanel
    const originalFeatures = [
        { name: 'Material Quality', value: '100% Cotton', score: 9, isGood: true },
        { name: 'Breathability', value: 'Very Good', score: 8, isGood: true },
        { name: 'Comfort Level', value: 'Excellent', score: 9, isGood: true },
        { name: 'Durability', value: 'Good', score: 7, isGood: true }
    ];

    // Add these helper functions
    const getScoreColor = (score: number): string => {
        if (score >= 8) return '#4caf50'; // Green
        if (score >= 6) return '#ff9800'; // Orange
        return '#f44336'; // Red
    };

    const getSuitabilityColor = (suitability: string): 'success' | 'warning' | 'error' | 'info' => {
        switch (suitability) {
            case 'Excellent': return 'success';
            case 'Good': return 'info';
            case 'Fair': return 'warning';
            case 'Poor': return 'error';
            default: return 'info';
        }
    };

    // Add this function for handling weather effects
    const handleEffectChange = async (effect: string) => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setSelectedEffect(effect);

        // Apply the effect using mallComponent
        if (effect === 'wet') {
            mallComponent.applyWetEffectTransition();
        } else if (effect === 'hot') {
            mallComponent.applyHotEffectTransition();
        } else if (effect === 'cold') {
            mallComponent.applyColdEffectTransition();
        } else {
            mallComponent.removeAllEffect();
        }

        setIsTransitioning(false);
    };

    // Calculate overall original score
    const originalOverallScore = Math.round(originalFeatures.reduce((sum, feature) => sum + feature.score, 0) / originalFeatures.length);

    // Calculate weather effects average score
    const weatherEffectsScore = Math.round(effectResults.reduce((sum, effect) => sum + effect.overallScore, 0) / effectResults.length);

    // Get current effect
    const currentEffect = effectResults.find(e => e.condition.toLowerCase().includes(selectedEffect));

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing) {
                const deltaX = e.clientX - initialXRef.current;
                const newWidth = Math.round(initialWidthRef.current + deltaX);
                const minWidth = 250;
                const maxWidth = Math.round(window.innerWidth * 0.7);
                if (newWidth < minWidth) setMasterPanelWidth(minWidth);
                else if (newWidth > maxWidth) setMasterPanelWidth(maxWidth);
                else setMasterPanelWidth(newWidth);
            }
            if (isResizingBottom) {
                const deltaY = initialYRef.current - e.clientY; // drag up increases panel height
                const newHeight = Math.round(initialBottomHeightRef.current + deltaY);
                const minHeight = 150;
                const maxHeight = Math.round(window.innerHeight * 0.6);
                if (newHeight < minHeight) setBottomPanelHeight(minHeight);
                else if (newHeight > maxHeight) setBottomPanelHeight(maxHeight);
                else setBottomPanelHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            const wasResizing = isResizing;
            setIsResizing(false);
            setIsResizingBottom(false);
            // call canvas moved once after finish
            if (mallComponent && typeof mallComponent.onCanvasMoved === 'function') {
                setTimeout(() => mallComponent.onCanvasMoved(), 40);
            }
        };

        if (isResizing || isResizingBottom) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, isResizingBottom, mallComponent]);

    return (
        <Box
            sx={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                bgcolor: '#f5f5f5',
                overflow: 'hidden' // Prevent overflow
            }}
        >
            {/* MASTER PANEL: Left side product list */}
            <Box
                ref={masterPanelRef}
                sx={{
                    width: masterPanelWidth,
                    height: '100%',
                    bgcolor: 'white',
                    boxShadow: 3,
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'width 0.3s ease',
                    borderRight: '1px solid #e0e0e0'
                }}
            >
                {/* Header */}
                <Box sx={{
                    p: 2,
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: '#f5f5f5'
                }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                        VR Clothing Mall
                    </Typography>

                    {/* Tabbed Navigation */}
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{ mb: 1 }}
                    >
                        <Tab
                            icon={<Store />}
                            label="Catalog"
                            iconPosition="start"
                        />
                        <Tab
                            icon={
                                <Badge badgeContent={inventoryItems.length} color="primary">
                                    <Inventory />
                                </Badge>
                            }
                            label="My Items"
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* Search Bar */}
                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Paper
                        component="form"
                        sx={{ p: '2px 4px', display: 'flex', alignItems: 'center' }}
                    >
                        <InputBase
                            sx={{ ml: 1, flex: 1 }}
                            placeholder={activeTab === 0 ? "Search catalog..." : "Search my items..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
                            <Search />
                        </IconButton>
                    </Paper>
                </Box>

                {/* Product List - Conditional rendering based on active tab */}
                <Box sx={{
                    p: 2,
                    overflowY: 'auto',
                    flex: 1,
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: '#888', borderRadius: '3px' }
                }}>
                    {activeTab === 0 ? (
                        // CATALOG TAB with 2D images
                        filteredProducts.length > 0 ? (
                            <List>
                                {filteredProducts.map(product => (
                                    <ListItem key={product.id} disablePadding>
                                        <ListItemButton
                                            selected={selectedProduct.id === product.id}
                                            onClick={() => handleProductSelect(product)}
                                            sx={{
                                                borderRadius: 1,
                                                mb: 1,
                                                border: '1px solid #e0e0e0',
                                                bgcolor: selectedProduct.id === product.id ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                p: 1
                                            }}
                                        >
                                            {/* 2D Product Image */}
                                            <Box
                                                component="img"
                                                src={product.image}
                                                alt={product.name}
                                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                                    // Fallback to a colored box if image fails to load
                                                    e.currentTarget.style.backgroundColor = product.color.toLowerCase();
                                                    e.currentTarget.style.height = '120px';
                                                    e.currentTarget.alt = "Image not found";
                                                }}
                                                sx={{
                                                    width: '100%',
                                                    height: '120px', // Fixed height
                                                    borderRadius: 1,
                                                    mb: 1,
                                                    objectFit: 'cover', // Changed from contain to cover
                                                    backgroundColor: '#f9f9f9'
                                                }}
                                            />

                                            <Box sx={{ width: '100%' }}>
                                                <Typography variant="subtitle1">
                                                    {product.name}
                                                </Typography>

                                                <Box sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    mt: 0.5
                                                }}>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {product.price}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            bgcolor: product.color.toLowerCase(),
                                                            color: ['White', 'Yellow'].includes(product.color) ? 'black' : 'white',
                                                            px: 1,
                                                            py: 0.5,
                                                            borderRadius: 0.5
                                                        }}
                                                    >
                                                        {product.color}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography color="text.secondary">
                                    No products match your search
                                </Typography>
                            </Box>
                        )
                    ) : (
                        // INVENTORY TAB
                        filteredInventory.length > 0 ? (
                            <List>
                                {filteredInventory.map(item => (
                                    <ListItem key={item.id} disablePadding>
                                        <ListItemButton
                                            selected={selectedInventoryItem.id === item.id}
                                            onClick={() => handleInventorySelect(item)}
                                            sx={{
                                                borderRadius: 1,
                                                mb: 1,
                                                border: '1px solid #e0e0e0',
                                                bgcolor: selectedInventoryItem.id === item.id ? 'rgba(76, 175, 80, 0.08)' : 'transparent',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                p: 1
                                            }}
                                        >
                                            {/* Inventory Item Image */}
                                            <Box
                                                component="img"
                                                src={item.image}
                                                alt={item.name}
                                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                                    e.currentTarget.style.backgroundColor = item.color.toLowerCase();
                                                    e.currentTarget.style.height = '120px';
                                                    e.currentTarget.alt = "Image not found";
                                                }}
                                                sx={{
                                                    width: '100%',
                                                    height: '120px', // Fixed height
                                                    borderRadius: 1,
                                                    mb: 1,
                                                    objectFit: 'cover', // Changed from contain to cover
                                                    backgroundColor: '#f9f9f9'
                                                }}
                                            />

                                            <Box sx={{ width: '100%' }}>
                                                <Typography variant="subtitle1">
                                                    {item.name}
                                                </Typography>

                                                <Box sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    mt: 0.5
                                                }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Worn: {item.wearCount} times
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            bgcolor: item.color.toLowerCase(),
                                                            color: ['White', 'Yellow'].includes(item.color) ? 'black' : 'white',
                                                            px: 1,
                                                            py: 0.5,
                                                            borderRadius: 0.5
                                                        }}
                                                    >
                                                        {item.color}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography color="text.secondary">
                                    No items match your search
                                </Typography>
                            </Box>
                        )
                    )}
                </Box>
            </Box>

            {/* Resize Divider */}
            <Box
                sx={{
                    width: '8px',
                    height: '100%',
                    bgcolor: '#f0f0f0',
                    cursor: 'col-resize',
                    borderLeft: '1px solid #e0e0e0',
                    borderRight: '1px solid #e0e0e0',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': { bgcolor: '#e0e0e0' },
                    '&::after': {
                        content: '""',
                        width: '2px',
                        height: '20px',
                        bgcolor: '#bdbdbd',
                    }
                }}
                onMouseDown={handleResizeStart} // Add this handler
            />

            {/* DETAIL PANEL: Right side with 3D view and Analysis */}
            <Box
                sx={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Top Section: 3D Viewer */}
                <Box
                    sx={{
                        flex: 1,
                        position: 'relative',
                        minHeight: `calc(100% - ${bottomPanelHeight}px)`
                    }}
                >
                    {/* 3D View Container */}
                    <Box
                        data-testid="3d-view-container"
                        sx={{
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        ref={viewerContainerRef}
                    >
                        {/* Babylon canvas will be moved here */}
                    </Box>

                    {/* Floating Product Name */}
                    <Typography
                        variant="subtitle1"
                        sx={{
                            position: 'absolute',
                            top: 16,
                            left: 16,
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            padding: '4px 12px',
                            borderRadius: 1,
                            boxShadow: 1,
                            maxWidth: '60%',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {activeTab === 0 ? selectedProduct.name : selectedInventoryItem.name}
                    </Typography>
                </Box>

                {/* Resize handle for bottom panel */}
                <Box
                    sx={{
                        height: '8px',
                        width: '100%',
                        bgcolor: '#f0f0f0',
                        cursor: 'row-resize',
                        borderTop: '1px solid #e0e0e0',
                        borderBottom: '1px solid #e0e0e0',
                        userSelect: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': { bgcolor: '#e0e0e0' },
                        '&::after': {
                            content: '""',
                            height: '2px',
                            width: '20px',
                            bgcolor: '#bdbdbd',
                        }
                    }}
                    onMouseDown={handleBottomResizeStart}
                />

                {/* Bottom Section: Analysis Panel */}
                <Box
                    sx={{
                        height: `${bottomPanelHeight}px`,
                        bgcolor: '#f9f9f9',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden' // Hide overflow
                    }}
                >
                   

                    <TabContext value={bottomTabValue}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                            <TabList
                                onChange={handleBottomTabChange}
                                aria-label="product information tabs"
                                variant="fullWidth"
                            >
                                <Tab label="Analysis" value="analysis" icon={<Star fontSize="small" />} iconPosition="start" />
                                <Tab label="Details" value="details" icon={<Info fontSize="small" />} iconPosition="start" />
                                <Tab label="Reviews" value="reviews" icon={<Star fontSize="small" />} iconPosition="start" />
                            </TabList>
                        </Box>

                        <TabPanel value="details" sx={{ p: 2, pt: 1, overflow: 'auto', height: `${bottomPanelHeight - 80}px` }}>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Product Details
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    <Chip
                                        label={`Color: ${activeTab === 0 ? selectedProduct.color : selectedInventoryItem.color}`}
                                        size="small"
                                        sx={{ bgcolor: '#eaeaea' }}
                                    />
                                    <Chip
                                        label={`Material: ${activeTab === 0 ? selectedProduct.material : selectedInventoryItem.material}`}
                                        size="small"
                                        sx={{ bgcolor: '#eaeaea' }}
                                    />
                                    {activeTab === 0 && (
                                        <Chip
                                            label={`Price: ${selectedProduct.price}`}
                                            size="small"
                                            sx={{ bgcolor: '#eaeaea' }}
                                        />
                                    )}
                                    {activeTab === 1 && (
                                        <Chip
                                            label={`Worn: ${selectedInventoryItem.wearCount} times`}
                                            size="small"
                                            sx={{ bgcolor: '#eaeaea' }}
                                        />
                                    )}
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {activeTab === 0 ? (
                                <>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Description
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                        {selectedProduct.description}
                                    </Typography>

                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Compatibility Analysis
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: '50%',
                                                bgcolor: 'success.main'
                                            }}
                                        />
                                        <Typography variant="body2">
                                            This item pairs well with items in your inventory
                                        </Typography>
                                    </Box>
                                </>
                            ) : (
                                <>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Purchase History
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                        Purchased on {new Date(selectedInventoryItem.purchaseDate).toLocaleDateString()}
                                    </Typography>

                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Usage Statistics
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">Wear frequency:</Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {selectedInventoryItem.wearCount > 8 ? 'High' :
                                                    selectedInventoryItem.wearCount > 3 ? 'Medium' : 'Low'}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                mt: 1,
                                                height: 8,
                                                borderRadius: 4,
                                                bgcolor: '#e0e0e0',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    height: '100%',
                                                    width: `${Math.min(selectedInventoryItem.wearCount * 10, 100)}%`,
                                                    bgcolor: 'primary.main',
                                                    borderRadius: 4
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </>
                            )}
                        </TabPanel>

                        {/* REVIEWS TAB */}
                        <TabPanel value="reviews" sx={{ p: 2, pt: 1, overflow: 'auto', height: `${bottomPanelHeight - 80}px` }}>
                            {activeTab === 0 && (
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            Customer Reviews
                                        </Typography>
                                        <Chip
                                            label="4.7"
                                            size="small"
                                            color="primary"
                                            sx={{ ml: 1, height: 20, fontWeight: 'bold' }}
                                        />
                                    </Box>

                                    {/* Rating Stars */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Box
                                                key={star}
                                                component="span"
                                                sx={{
                                                    color: star <= 4 ? 'gold' : (star === 5 ? 'rgba(255, 215, 0, 0.5)' : 'gray'),
                                                    fontSize: '20px',
                                                    mr: 0.5
                                                }}
                                            >
                                                ★
                                            </Box>
                                        ))}
                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                            based on 42 reviews
                                        </Typography>
                                    </Box>

                                    {/* Rating Distribution */}
                                    <Box sx={{ mb: 2 }}>
                                        {[5, 4, 3, 2, 1].map((rating) => (
                                            <Box key={rating} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <Typography variant="caption" sx={{ minWidth: 20 }}>
                                                    {rating}★
                                                </Typography>
                                                <Box sx={{ flex: 1, mx: 1 }}>
                                                    <Box
                                                        sx={{
                                                            height: 6,
                                                            borderRadius: 3,
                                                            bgcolor: '#e0e0e0',
                                                            position: 'relative',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                height: '100%',
                                                                width: rating === 5 ? '65%' :
                                                                    rating === 4 ? '25%' :
                                                                        rating === 3 ? '7%' :
                                                                            rating === 2 ? '2%' : '1%',
                                                                bgcolor: rating >= 4 ? 'success.main' :
                                                                    rating >= 3 ? 'warning.main' : 'error.main',
                                                                borderRadius: 3
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                                <Typography variant="caption" sx={{ minWidth: 30, textAlign: 'right' }}>
                                                    {rating === 5 ? '65%' :
                                                        rating === 4 ? '25%' :
                                                            rating === 3 ? '7%' :
                                                                rating === 2 ? '2%' : '1%'}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>

                                    {/* Individual Reviews */}
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Recent Reviews
                                    </Typography>

                                    {/* Individual Reviews */}
                                    {/*
                                        Here, you can map through an array of review objects
                                        and display each review in a styled box.
                                    */}
                                    {/*
                                        Example review object structure:
                                        {
                                            id: 1,
                                            name: "Alex",
                                            avatar: "A",
                                            rating: 5,
                                            date: "2025-09-02",
                                            comment: "Love the fit and the material feels premium. Perfect for casual wear!"
                                        }
                                    */}
                                    {/*
                                        For the sake of this example, let's assume we have two static reviews:
                                    */}
                                    {/*
                                        1. Alex - 5 stars - "Love the fit and the material feels premium. Perfect for casual wear!"
                                        2. Jordan - 4 stars - "Great shirt but runs slightly small. Order one size up."
                                    */}
                                    {/*
                                        You can replace this static data with real review data from your backend/API.
                                    */}
                                    {/*
                                        And don't forget to add animations for the appearance of these reviews!
                                    */}

                                    {/* View More Link */}
                                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                                        <Button
                                            size="small"
                                            color="primary"
                                            sx={{
                                                textTransform: 'none',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                                }
                                            }}
                                        >
                                            View all 42 reviews
                                        </Button>
                                    </Box>
                                </Box>
                            )}

                            {activeTab === 1 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No reviews available for inventory items
                                    </Typography>
                                </Box>
                            )}
                        </TabPanel>

                      
                        <TabPanel value="analysis" sx={{ p: 2, pt: 1, overflow: 'auto', height: `${bottomPanelHeight - 80}px` }}>
                            {/* Overall Quality Score Cards and Features in a single row */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'medium' }}>
                                    Product Features
                                </Typography>
                                <Grid container spacing={2}>
                                    {/* Score Cards */}
                                    <Grid spacing={3}>
                                        <Card sx={{ backgroundColor: '#f8f9fa', height: '100%', textAlign: 'center', py: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                                                Original Quality
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: getScoreColor(originalOverallScore) }}>
                                                {originalOverallScore}/10
                                            </Typography>
                                            <Chip
                                                label={originalOverallScore >= 8 ? 'Excellent' : originalOverallScore >= 6 ? 'Good' : 'Fair'}
                                                size="small"
                                                color={originalOverallScore >= 8 ? 'success' : originalOverallScore >= 6 ? 'warning' : 'error'}
                                            />
                                        </Card>
                                    </Grid>

                                    <Grid spacing={3}>
                                        <Card sx={{ backgroundColor: '#f8f9fa', height: '100%', textAlign: 'center', py: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                                                Weather Performance
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: getScoreColor(weatherEffectsScore) }}>
                                                {weatherEffectsScore}/10
                                            </Typography>
                                            <Chip
                                                label={weatherEffectsScore >= 8 ? 'Excellent' : weatherEffectsScore >= 6 ? 'Good' : 'Fair'}
                                                size="small"
                                                color={weatherEffectsScore >= 8 ? 'success' : weatherEffectsScore >= 6 ? 'warning' : 'error'}
                                            />
                                        </Card>
                                    </Grid>

                                    {/* Features - placed in the same row */}
                                    {originalFeatures.map((feature, index) => (
                                        <Grid spacing={1.5} key={index}>
                                            <Card sx={{ height: '100%', p: 1 }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                            {feature.name}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                                                {feature.value}
                                                            </Typography>
                                                            {feature.isGood ?
                                                                <ThumbUp color="success" sx={{ fontSize: 14 }} /> :
                                                                <ThumbDown color="error" sx={{ fontSize: 14 }} />
                                                            }
                                                        </Box>
                                                    </Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: getScoreColor(feature.score), textAlign: 'right' }}>
                                                        {feature.score}
                                                    </Typography>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            {/* Weather Test Buttons - Using compact layout from MainProductLayout */}
                            <Box sx={{ mt: 3, mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Test Different Weather Conditions
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant={selectedEffect === 'original' ? 'contained' : 'outlined'}
                                        color="success"
                                        size="small"
                                        disabled={isTransitioning}
                                        onClick={() => handleEffectChange('original')}
                                        startIcon={<CheckCircle />}
                                        sx={{ flex: 1 }}
                                    >
                                        Normal
                                    </Button>
                                    <Button
                                        variant={selectedEffect === 'wet' ? 'contained' : 'outlined'}
                                        color="primary"
                                        size="small"
                                        disabled={isTransitioning}
                                        onClick={() => handleEffectChange('wet')}
                                        startIcon={<Water />}
                                        sx={{ flex: 1 }}
                                    >
                                        Wet
                                    </Button>
                                    <Button
                                        variant={selectedEffect === 'hot' ? 'contained' : 'outlined'}
                                        color="error"
                                        size="small"
                                        disabled={isTransitioning}
                                        onClick={() => handleEffectChange('hot')}
                                        startIcon={<Whatshot />}
                                        sx={{ flex: 1 }}
                                    >
                                        Hot
                                    </Button>
                                    <Button
                                        variant={selectedEffect === 'cold' ? 'contained' : 'outlined'}
                                        color="info"
                                        size="small"
                                        disabled={isTransitioning}
                                        onClick={() => handleEffectChange('cold')}
                                        startIcon={<AcUnit />}
                                        sx={{ flex: 1 }}
                                    >
                                        Cold
                                    </Button>
                                </Box>
                            </Box>

                            {/* Current Effect Results - Enhanced from ProductReviewPanel */}
                            {currentEffect && selectedEffect !== 'original' && (
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
                                            {currentEffect.condition} Performance
                                        </Typography>
                                        <Box sx={{ flex: 1, mx: 2 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={currentEffect.overallScore * 10}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    backgroundColor: '#e0e0e0',
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: getScoreColor(currentEffect.overallScore)
                                                    }
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="body1" fontWeight="bold" sx={{ color: getScoreColor(currentEffect.overallScore) }}>
                                            {currentEffect.overallScore}/10
                                        </Typography>
                                    </Box>

                                    {/* Suitability */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Chip
                                            label={currentEffect.suitability}
                                            color={getSuitabilityColor(currentEffect.suitability)}
                                            size="small"
                                        />
                                        <Typography variant="body2" fontWeight="medium">
                                            {currentEffect.simpleRecommendation}
                                        </Typography>
                                    </Box>

                                    {/* Pros and Cons */}
                                    <Grid container spacing={1}>
                                        <Grid spacing={6}>
                                            <Box sx={{ bgcolor: 'success.light', p: 1, borderRadius: 1 }}>
                                                <Typography variant="caption" fontWeight="bold" color="success.dark">
                                                    <ThumbUp fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '0.8rem' }} />
                                                    Pros
                                                </Typography>
                                                <List dense disablePadding>
                                                    {currentEffect.pros.map((pro, idx) => (
                                                        <ListItem key={idx} sx={{ py: 0 }}>
                                                            <Typography variant="caption">{pro}</Typography>
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Box>
                                        </Grid>
                                        <Grid spacing={6}>
                                            <Box sx={{ bgcolor: 'error.light', p: 1, borderRadius: 1 }}>
                                                <Typography variant="caption" fontWeight="bold" color="error.dark">
                                                    <ThumbDown fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '0.8rem' }} />
                                                    Cons
                                                </Typography>
                                                <List dense disablePadding>
                                                    {currentEffect.cons.map((con, idx) => (
                                                        <ListItem key={idx} sx={{ py: 0 }}>
                                                            <Typography variant="caption">{con}</Typography>
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </TabPanel>
                    </TabContext>
                </Box>
            </Box>
        </Box>
    );
};