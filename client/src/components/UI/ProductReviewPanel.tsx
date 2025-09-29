import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    Chip,
    Button,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Rating,
    IconButton,
    Fab,
    Collapse,
    CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    ExpandMore,
    Water,
    Whatshot,
    AcUnit,
    Checkroom,
    Star,
    Warning,
    CheckCircle,
    Close,
    Analytics
} from '@mui/icons-material';

interface ProductFeature {
    name: string;
    value: string;
    rating: number;
}

interface EffectResult {
    condition: string;
    icon: React.ReactNode;
    color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    effects: string[];
    recommendation: string;
    rating: number;
}
interface ProductReviewPanelProps {
    onEffectChange?: (effect: string) => void;
}

export const ProductReviewPanel: React.FC<ProductReviewPanelProps> = ({ onEffectChange }) => {
    const [selectedEffect, setSelectedEffect] = useState<string>('original');
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

    const originalFeatures: ProductFeature[] = [
        { name: 'Material', value: '100% Cotton', rating: 4.5 },
        { name: 'Breathability', value: 'High', rating: 4.8 },
        { name: 'Comfort', value: 'Excellent', rating: 4.7 },
        { name: 'Durability', value: 'Good', rating: 4.2 }
    ];

    const effectResults: EffectResult[] = [
        {
            condition: 'Wet Conditions',
            icon: <Water />,
            color: 'primary',
            effects: [
                'Absorbs water quickly due to cotton fibers',
                'Takes 2-3 hours to dry completely',
                'Becomes heavier when wet',
                'May lose shape temporarily'
            ],
            recommendation: 'Avoid wearing in heavy rain. Good for light exercise.',
            rating: 3.2
        },
        {
            condition: 'Hot Conditions',
            icon: <Whatshot />,
            color: 'error',
            effects: [
                'Excellent breathability keeps you cool',
                'Natural cotton wicks moisture well',
                'UV protection: Moderate (UPF 15-20)',
                'No synthetic odor buildup'
            ],
            recommendation: 'Perfect for hot weather. Consider light colors.',
            rating: 4.6
        },
        {
            condition: 'Cold Conditions',
            icon: <AcUnit />,
            color: 'info',
            effects: [
                'Provides minimal insulation',
                'Not wind resistant',
                'Cotton retains some warmth when dry',
                'Suitable for layering'
            ],
            recommendation: 'Best used as a base layer in cold weather.',
            rating: 3.4
        }
    ];

    const currentEffect = effectResults.find(e => e.condition.toLowerCase().includes(selectedEffect));

    const handleEffectChange = async (effect: string) => {
        if (isTransitioning) return;
        
        setIsTransitioning(true);
        setSelectedEffect(effect);
        
        // Trigger the effect change in the 3D scene
        if (onEffectChange) {
            await onEffectChange(effect);
        }
        
        setIsTransitioning(false);
    };

    return (
        <>
            {/* Toggle Button */}
            <Fab
                color="primary"
                aria-label="toggle analysis"
                onClick={() => setIsOpen(!isOpen)}
                sx={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    zIndex: 1001
                }}
            >
                {isOpen ? <Close /> : <Analytics />}
            </Fab>

            {/* Panel */}
            <Collapse in={isOpen}>
                <Box sx={{ position: 'fixed', top: 80, right: 20, width: 320, zIndex: 1000 }}>
                    <Paper elevation={8} sx={{ p: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
                            <Checkroom sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.2rem' }} />
                            Product Analysis
                        </Typography>

                        <Divider sx={{ mb: 1.5 }} />

                        {/* Original Features Section - Condensed */}
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />} sx={{ py: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                                    Original Features
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ py: 1 }}>
                                <List dense>
                                    {originalFeatures.map((feature, index) => (
                                        <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                                            <ListItemIcon sx={{ minWidth: 24 }}>
                                                <CheckCircle color="success" fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                                        {feature.name}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Typography variant="caption">{feature.value}</Typography>
                                                        <Rating value={feature.rating} precision={0.1} size="small" readOnly sx={{ fontSize: '0.8rem' }} />
                                                    </span>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>

                        {/* Effect Selection - Smaller buttons */}
                        <Box sx={{ my: 1.5 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                                Test Conditions
                            </Typography>
                            <Grid container spacing={0.5}>
                                <Grid size={4}>
                                    <Button
                                        variant={selectedEffect === 'original' ? 'contained' : 'outlined'}
                                        color="success"
                                        fullWidth
                                        size="small"
                                        disabled={isTransitioning}
                                        onClick={() => handleEffectChange('original')}
                                        sx={{ fontSize: '0.7rem', py: 0.5 }}
                                    >
                                        Original
                                    </Button>
                                </Grid>
                                {effectResults.map((effect, index) => (
                                    <Grid size={4} key={index}>
                                        <Button
                                            variant={selectedEffect === effect.condition.toLowerCase().split(' ')[0] ? 'contained' : 'outlined'}
                                            color={effect.color}
                                            fullWidth
                                            size="small"
                                            startIcon={isTransitioning ? <CircularProgress size={12} /> : effect.icon}
                                            disabled={isTransitioning}
                                            onClick={() => handleEffectChange(effect.condition.toLowerCase().split(' ')[0])}
                                            sx={{ fontSize: '0.7rem', py: 0.5 }}
                                        >
                                            {effect.condition.split(' ')[0]}
                                        </Button>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        {/* Current Effect Results - Condensed */}
                        {currentEffect && (
                            <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMore />} sx={{ py: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {currentEffect.icon}
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                                            {currentEffect.condition} Results
                                        </Typography>
                                        <Rating value={currentEffect.rating} precision={0.1} size="small" readOnly sx={{ fontSize: '0.8rem' }} />
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ py: 1 }}>
                                    <List dense>
                                        {currentEffect.effects.map((effect, index) => (
                                            <ListItem key={index} sx={{ px: 0, py: 0.25 }}>
                                                <ListItemIcon sx={{ minWidth: 20 }}>
                                                    <Star color="action" fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                                            {effect}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>

                                    <Card sx={{ mt: 1, backgroundColor: `${currentEffect.color}.50` }}>
                                        <CardContent sx={{ py: 1, px: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                                <Warning fontSize="small" />
                                                <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
                                                    AI Recommendation
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                                {currentEffect.recommendation}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </AccordionDetails>
                            </Accordion>
                        )}

                        {/* Footer */}
                        <Box sx={{ mt: 1.5, textAlign: 'center' }}>
                            <Chip
                                label="AI-Powered Analysis"
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                            />
                        </Box>
                    </Paper>
                </Box>
            </Collapse>
        </>
    );
}