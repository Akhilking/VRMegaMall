import React, { useState } from "react";
import { Box, List, ListItem, ListItemButton, ListItemAvatar, Avatar, ListItemText, Typography, IconButton } from "@mui/material";
import Grid from '@mui/material/Grid';
import { ArrowBack, ShoppingCart } from "@mui/icons-material";
import { MallComponent } from "../MallComponent";
import { Color3 } from "@babylonjs/core/Maths/math";

// Sample product data
const products = [
    {
        id: "tshirt_red",
        name: "Red Cotton Tee",
        image: "client/assets/images/sampleShirt.webp",
        price: "$24.99",
        description: "Comfortable 100% cotton t-shirt for everyday wear",
        color: "Red",
        material: "100% Cotton"
    },
    {
        id: "tshirt_blue",
        name: "Blue Cotton Tee",
        image: "client/assets/images/sampleShirt.webp",
        price: "$24.99",
        description: "Comfortable 100% cotton t-shirt for everyday wear",
        color: "Blue",
        material: "100% Cotton"
    },
    {
        id: "tshirt_black",
        name: "Black Cotton Tee",
        image: "client/assets/images/sampleShirt.webp",
        price: "$24.99",
        description: "Comfortable 100% cotton t-shirt for everyday wear",
        color: "Black",
        material: "100% Cotton"
    }
];

interface MainProductLayoutProps {
    mallComponent: MallComponent;
    onClose: () => void;
}

export const MainProductLayout: React.FC<MainProductLayoutProps> = ({ mallComponent, onClose }) => {
    const [selectedProduct, setSelectedProduct] = useState(products[0]);
    const [isListVisible, setIsListVisible] = useState(true);

    const handleProductSelect = (product: any) => {
        setSelectedProduct(product);
        setIsListVisible(false);

        // Change the shirt color in Babylon scene based on the selected product
        const color = product.color.toLowerCase();
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
            default:
                mallComponent.applyCottonMaterial(new Color3(1, 1, 1));
        }
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: '300px',
                height: '100%',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                boxShadow: 3,
                zIndex: 1000,
                transition: 'transform 0.3s ease-in-out',
                transform: isListVisible ? 'translateX(0)' : 'translateX(-100%)'
            }}
        >
            {/* Header */}
            <Box sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e0e0e0'
            }}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    T-Shirts
                </Typography>
                <IconButton onClick={onClose}>
                    <ArrowBack />
                </IconButton>
            </Box>

            {/* Product List */}
            <Box sx={{ p: 2, overflowY: 'auto', height: 'calc(100% - 60px)' }}>
                <List>
                    {products.map(product => (
                        <ListItem key={product.id} disablePadding>
                            <ListItemButton
                                selected={selectedProduct.id === product.id}
                                onClick={() => handleProductSelect(product)}
                                sx={{
                                    borderRadius: 1,
                                    mb: 1,
                                    bgcolor: selectedProduct.id === product.id ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar
                                        sx={{
                                            width: 50,
                                            height: 50,
                                            bgcolor: product.color.toLowerCase()
                                        }}
                                    >
                                        T
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={product.name}
                                    secondary={product.price}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Box>
    );
};