import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BatchesScreen from '../screens/batches/BatchesScreen';
import TestSeriesDetailScreen from '../screens/batches/TestSeriesDetailScreen';
import TestAttemptScreen from '../screens/batches/TestAttemptScreen';
import TestResultScreen from '../screens/batches/TestResultScreen';
import DownloadsScreen from '../screens/batches/DownloadsScreen';
import AttachmentViewerScreen from '../screens/batches/AttachmentViewerScreen';
import MyPurchasesScreen from '../screens/purchases/MyPurchasesScreen';
import PurchaseReceiptDetailScreen from '../screens/purchases/PurchaseReceiptDetailScreen';
import PurchasePreviewScreen from '../screens/purchases/PurchasePreviewScreen';

const Stack = createNativeStackNavigator();

export default function BatchesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BatchesList" component={BatchesScreen} />
      <Stack.Screen name="PurchasePreview" component={PurchasePreviewScreen} />
      <Stack.Screen name="Downloads" component={DownloadsScreen} />
      <Stack.Screen name="AttachmentViewer" component={AttachmentViewerScreen} />
      <Stack.Screen name="MyPurchases" component={MyPurchasesScreen} />
      <Stack.Screen name="PurchaseReceiptDetail" component={PurchaseReceiptDetailScreen} />
      <Stack.Screen name="TestSeriesDetail" component={TestSeriesDetailScreen} />
      <Stack.Screen name="TestAttempt" component={TestAttemptScreen} />
      <Stack.Screen name="TestResult" component={TestResultScreen} />
    </Stack.Navigator>
  );
}
