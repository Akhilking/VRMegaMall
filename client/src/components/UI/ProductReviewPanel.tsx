import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    Button,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Fab,
    Collapse,
    CircularProgress,
    LinearProgress,
    Alert,
    Chip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    ExpandMore,
    Water,
    Whatshot,
    AcUnit,
    Checkroom,
    ThumbUp,
    ThumbDown,
    Warning,
    CheckCircle,
    Close,
    Analytics,
    Star,
    TrendingUp,
    TrendingDown,
    Remove
} from '@mui/icons-material';

interface ProductFeature {
    name: string;
    value: string;
    score: number; // Changed from rating to score (0-10)
    isGood: boolean; // Simple good/bad indicator
}

interface EffectResult {
    condition: string;
    icon: React.ReactNode;
    color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    overallScore: number; // Overall score out of 10
    pros: string[]; // Positive aspects
    cons: string[]; // Negative aspects
    simpleRecommendation: string; // Plain language recommendation
    suitability: 'Excellent' | 'Good' | 'Fair' | 'Poor'; // Simple rating
}

interface ProductReviewPanelProps {
    onEffectChange?: (effect: string) => void;
}

export const ProductReviewPanel: React.FC<ProductReviewPanelProps> = ({ onEffectChange }) => {
    const [selectedEffect, setSelectedEffect] = useState<string>('original');
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

    // Simplified original features with clear scoring
    const originalFeatures: ProductFeature[] = [
        { name: 'Material Quality', value: '100% Cotton', score: 9, isGood: true },
        { name: 'Breathability', value: 'Very Good', score: 8, isGood: true },
        { name: 'Comfort Level', value: 'Excellent', score: 9, isGood: true },
        { name: 'Durability', value: 'Good', score: 7, isGood: true }
    ];

    // Calculate overall original score
    const originalOverallScore = Math.round(originalFeatures.reduce((sum, feature) => sum + feature.score, 0) / originalFeatures.length);

    // Enhanced effect results with clear pros/cons
    const effectResults: EffectResult[] = [
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

    // Calculate weather effects average score
    const weatherEffectsScore = Math.round(effectResults.reduce((sum, effect) => sum + effect.overallScore, 0) / effectResults.length);

    const currentEffect = effectResults.find(e => e.condition.toLowerCase().includes(selectedEffect));

    const handleEffectChange = async (effect: string) => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setSelectedEffect(effect);

        if (onEffectChange) {
            await onEffectChange(effect);
        }

        setIsTransitioning(false);
    };

    // Helper function to get score color
    const getScoreColor = (score: number): string => {
        if (score >= 8) return '#4caf50'; // Green
        if (score >= 6) return '#ff9800'; // Orange
        return '#f44336'; // Red
    };

    // Helper function to get suitability color
    const getSuitabilityColor = (suitability: string): 'success' | 'warning' | 'error' | 'info' => {
        switch (suitability) {
            case 'Excellent': return 'success';
            case 'Good': return 'info';
            case 'Fair': return 'warning';
            case 'Poor': return 'error';
            default: return 'info';
        }
    };

    return (
        <>
            {/* Toggle Button - Larger for easier access */}
            <Fab
                color="primary"
                aria-label="Product Analysis"
                onClick={() => setIsOpen(!isOpen)}
                sx={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    zIndex: 1001,
                    width: 64,
                    height: 64 // Larger button
                }}
            >
                {isOpen ? <Close fontSize="large" /> : <Analytics fontSize="large" />}
            </Fab>

            {/* Full-Height Sidebar Panel */}
            <Collapse in={isOpen}>
                <Box sx={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: 400, // Wider panel
                    height: '100vh', // Full screen height
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Paper
                        elevation={8}
                        sx={{
                            flex: 1,
                            p: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                            overflowY: 'auto',
                            borderRadius: '16px 0 0 16px' // Rounded left corners
                        }}
                    >
                        {/* Header with Overall Scores */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.4rem' }}>
                                <Checkroom sx={{ mr: 1, verticalAlign: 'middle', fontSize: '1.6rem' }} />
                                Product Review
                            </Typography>

                            {/* Summary Score Cards */}
                            <Grid container spacing={1} sx={{ mb: 2 }}>
                                <Grid size={6}>
                                    <Card sx={{ backgroundColor: '#f8f9fa', textAlign: 'center', py: 1 }}>
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
                                <Grid size={6}>
                                    <Card sx={{ backgroundColor: '#f8f9fa', textAlign: 'center', py: 1 }}>
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
                            </Grid>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* Original Features - Simplified */}
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                    Product Features
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <List>
                                    {originalFeatures.map((feature, index) => (
                                        <Card key={index} sx={{ mb: 1, p: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {feature.isGood ?
                                                        <ThumbUp color="success" fontSize="small" /> :
                                                        <ThumbDown color="error" fontSize="small" />
                                                    }
                                                    <Box>
                                                        <Typography variant="body1" sx={{ fontWeight: 'medium', fontSize: '1rem' }}>
                                                            {feature.name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {feature.value}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: getScoreColor(feature.score) }}>
                                                        {feature.score}/10
                                                    </Typography>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={feature.score * 10}
                                                        sx={{
                                                            height: 6,
                                                            borderRadius: 3,
                                                            backgroundColor: '#e0e0e0',
                                                            '& .MuiLinearProgress-bar': {
                                                                backgroundColor: getScoreColor(feature.score)
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        </Card>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>

                        {/* Weather Test Buttons - Larger and clearer */}
                        <Box sx={{ my: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', fontSize: '1.1rem', mb: 2 }}>
                                Test Different Weather
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid size={6}>
                                    <Button
                                        variant={selectedEffect === 'original' ? 'contained' : 'outlined'}
                                        color="success"
                                        fullWidth
                                        size="large"
                                        disabled={isTransitioning}
                                        onClick={() => handleEffectChange('original')}
                                        sx={{
                                            fontSize: '1rem',
                                            py: 1.5,
                                            textTransform: 'none'
                                        }}
                                    >
                                        {isTransitioning && selectedEffect === 'original' ?
                                            <CircularProgress size={20} sx={{ mr: 1 }} /> :
                                            <CheckCircle sx={{ mr: 1 }} />
                                        }
                                        Normal
                                    </Button>
                                </Grid>
                                {effectResults.map((effect, index) => (
                                    <Grid size={6} key={index}>
                                        <Button
                                            variant={selectedEffect === effect.condition.toLowerCase().split(' ')[0] ? 'contained' : 'outlined'}
                                            color={effect.color}
                                            fullWidth
                                            size="large"
                                            disabled={isTransitioning}
                                            onClick={() => handleEffectChange(effect.condition.toLowerCase().split(' ')[0])}
                                            sx={{
                                                fontSize: '1rem',
                                                py: 1.5,
                                                textTransform: 'none'
                                            }}
                                        >
                                            {isTransitioning && selectedEffect === effect.condition.toLowerCase().split(' ')[0] ?
                                                <CircularProgress size={20} sx={{ mr: 1 }} /> :
                                                React.isValidElement(effect.icon)
                                                    ? React.cloneElement(effect.icon as React.ReactElement<any, any>, { sx: { mr: 1 } })
                                                    : effect.icon
                                            }
                                            {effect.condition.replace(' Weather', '')}
                                        </Button>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        {/* Weather Test Results - Enhanced */}
                        {currentEffect && (
                            <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {currentEffect.icon}
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {currentEffect.condition} Test
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {/* Overall Score Card */}
                                    <Card sx={{ mb: 2, p: 2, backgroundColor: '#f8f9fa' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                Overall Performance
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: getScoreColor(currentEffect.overallScore) }}>
                                                {currentEffect.overallScore}/10
                                            </Typography>
                                        </Box>
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
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                            <Chip
                                                label={currentEffect.suitability}
                                                color={getSuitabilityColor(currentEffect.suitability)}
                                                size="medium"
                                            />
                                        </Box>
                                    </Card>

                                    {/* Pros and Cons */}
                                    <Grid container spacing={1}>
                                        <Grid size={6}>
                                            <Card sx={{ p: 1.5, backgroundColor: '#e8f5e8' }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                                                    <ThumbUp sx={{ mr: 0.5, fontSize: '1rem' }} />
                                                    Good Points
                                                </Typography>
                                                <List dense>
                                                    {currentEffect.pros.map((pro, index) => (
                                                        <ListItem key={index} sx={{ px: 0, py: 0.25 }}>
                                                            <ListItemIcon sx={{ minWidth: 20 }}>
                                                                <CheckCircle color="success" fontSize="small" />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={
                                                                    <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                                                        {pro}
                                                                    </Typography>
                                                                }
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Card>
                                        </Grid>
                                        <Grid size={6}>
                                            <Card sx={{ p: 1.5, backgroundColor: '#ffeaea' }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'error.main', mb: 1 }}>
                                                    <ThumbDown sx={{ mr: 0.5, fontSize: '1rem' }} />
                                                    Watch Out For
                                                </Typography>
                                                <List dense>
                                                    {currentEffect.cons.map((con, index) => (
                                                        <ListItem key={index} sx={{ px: 0, py: 0.25 }}>
                                                            <ListItemIcon sx={{ minWidth: 20 }}>
                                                                <Warning color="error" fontSize="small" />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={
                                                                    <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                                                        {con}
                                                                    </Typography>
                                                                }
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Card>
                                        </Grid>
                                    </Grid>

                                    {/* Simple Recommendation */}
                                    <Alert
                                        severity={getSuitabilityColor(currentEffect.suitability)}
                                        sx={{ mt: 2, fontSize: '1rem' }}
                                    >
                                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                            {currentEffect.simpleRecommendation}
                                        </Typography>
                                    </Alert>
                                </AccordionDetails>
                            </Accordion>
                        )}

                        {/* Footer */}
                        <Box sx={{ mt: 3, textAlign: 'center', pt: 2, borderTop: '1px solid #e0e0e0' }}>
                            <Chip
                                label="✨ AI-Powered Smart Analysis"
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.9rem', px: 1 }}
                            />
                        </Box>
                    </Paper>
                </Box>
            </Collapse>
        </>
    );
};