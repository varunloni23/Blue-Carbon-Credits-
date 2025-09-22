import React from 'react';
import { Box, Card, CardContent, Typography, Chip, styled } from '@mui/material';
import {
  AccountBalanceWallet,
  TrendingUp,
  Analytics,
  Speed,
  Security,
  Token,
  SwapHoriz,
  Public,
} from '@mui/icons-material';

// Styled components for crypto theme
export const GlassmorphismCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 20,
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 16px 48px 0 rgba(31, 38, 135, 0.25)',
  },
}));

export const CryptoMetricCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(0, 212, 170, 0.3)',
  borderRadius: 16,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, #00D4AA 0%, #3B82F6 50%, #8B5CF6 100%)',
  },
}));

export const NetworkStatusIndicator = ({ networkName, isConnected, chainId }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      px: 2,
      py: 1,
      borderRadius: 2,
      background: isConnected 
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)'
        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
      border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
    }}
  >
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: isConnected ? '#10B981' : '#EF4444',
        boxShadow: `0 0 8px ${isConnected ? '#10B981' : '#EF4444'}`,
      }}
    />
    <Typography variant="body2" sx={{ fontWeight: 600, color: isConnected ? '#10B981' : '#EF4444' }}>
      {networkName}
    </Typography>
    {chainId && (
      <Chip 
        label={`ID: ${chainId}`} 
        size="small" 
        sx={{ 
          fontSize: '0.7rem', 
          height: 20,
          backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: isConnected ? '#10B981' : '#EF4444',
        }} 
      />
    )}
  </Box>
);

export const WalletAddressDisplay = ({ address, label = "Wallet Address" }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      p: 2,
      borderRadius: 2,
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
    }}
  >
    <AccountBalanceWallet sx={{ color: '#00D4AA' }} />
    <Box>
      <Typography variant="body2" color="textSecondary">
        {label}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          fontFamily: 'monospace', 
          fontWeight: 600,
          background: 'linear-gradient(135deg, #00D4AA 0%, #3B82F6 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
      </Typography>
    </Box>
  </Box>
);

export const TokenMetricDisplay = ({ label, value, change, icon: Icon }) => (
  <CryptoMetricCard>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon sx={{ color: '#00D4AA', fontSize: 24 }} />
          <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
        </Box>
        {change && (
          <Chip
            label={`${change > 0 ? '+' : ''}${change}%`}
            size="small"
            sx={{
              backgroundColor: change > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: change > 0 ? '#10B981' : '#EF4444',
              fontWeight: 600,
            }}
          />
        )}
      </Box>
      <Typography 
        variant="h4" 
        sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #00D4AA 0%, #3B82F6 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {value}
      </Typography>
    </CardContent>
  </CryptoMetricCard>
);

export const BlockchainStatusCard = ({ 
  title, 
  status, 
  details = [],
  icon: Icon = Analytics,
  statusColor = '#00D4AA' 
}) => (
  <GlassmorphismCard>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${statusColor}20 0%, ${statusColor}10 100%)`,
          }}
        >
          <Icon sx={{ color: statusColor, fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Chip
            label={status}
            size="small"
            sx={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
              fontWeight: 600,
            }}
          />
        </Box>
      </Box>
      {details.map((detail, index) => (
        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
          <Typography variant="body2" color="textSecondary">
            {detail.label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {detail.value}
          </Typography>
        </Box>
      ))}
    </CardContent>
  </GlassmorphismCard>
);

export const CryptoIcons = {
  Wallet: AccountBalanceWallet,
  TrendingUp: TrendingUp,
  Analytics: Analytics,
  Speed: Speed,
  Security: Security,
  Token: Token,
  SwapHoriz: SwapHoriz,
  Public: Public,
};