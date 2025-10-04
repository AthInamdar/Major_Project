# NiyatKalpa 🏥

**A Mobile Application for Redistributing Near-Expiry Medicines**

NiyatKalpa is a React Native mobile app built with Expo that connects pharmacists with users to redistribute safe, near-expiry medicines at affordable prices. The app features OCR-based medicine scanning, smart pricing recommendations, location-based listings, and an AI chat assistant.

## 🌟 Features

### For Pharmacists
- **OCR Medicine Scanning**: Capture medicine labels and auto-fill details
- **Smart Price Recommendations**: AI-powered pricing based on expiry dates
- **Inventory Management**: Track and manage medicine listings
- **Location-based Visibility**: Reach nearby customers

### For Users
- **Location-based Search**: Find medicines near you
- **Advanced Filters**: Search by distance, expiry window, and medicine name
- **Cart Management**: Add medicines to cart (delivery coming soon)
- **Ved AI Assistant**: Get medicine information and guidance
- **Safety Information**: Clear expiry warnings and safety notes

### General Features
- **Role-based Authentication**: Separate flows for pharmacists and users
- **Interactive Onboarding**: 4-slide introduction tour
- **Maps Integration**: View nearby pharmacies and medicines
- **Real-time Updates**: Live inventory and pricing updates

## 🛠 Tech Stack

- **Framework**: Expo (React Native + TypeScript)
- **Navigation**: React Navigation 6
- **Styling**: NativeWind (Tailwind for React Native)
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Maps**: React Native Maps + Google Maps
- **Location**: Expo Location + Geofire
- **OCR**: Mock implementation (Expo Go) / ML Kit (Dev Client)
- **Storage**: AsyncStorage for local data

## 📱 App Architecture

```
/src
  /app
    App.tsx                 # Main app component
    /navigation
      index.tsx            # Root navigation with role-based tabs
      guards.tsx           # Authentication and role guards
    /screens
      Onboarding.tsx       # First-time user tour
      /Auth
        Login.tsx          # Email/password authentication
        Signup.tsx         # Registration with role selection
      /Pharmacist
        Upload.tsx         # OCR + form + price advice
        MyListings.tsx     # Manage medicine inventory
      /User
        Home.tsx           # Browse medicines with filters
        Details.tsx        # Medicine details and cart actions
        Cart.tsx           # Cart with delivery placeholder
        VedAI.tsx          # AI chat assistant
        MapNearby.tsx      # Map view of pharmacies
      Profile.tsx          # User profile and settings
      Location.tsx         # Location management
  /components
    MedicineCard.tsx       # Reusable medicine display
    PriceAdvice.tsx        # Smart pricing component
    EmptyState.tsx         # Empty state illustrations
    ChatBubble.tsx         # AI chat interface
  /services
    firebase.ts            # Firebase configuration
    firestore.ts           # Typed database operations
    geolocation.ts         # Location services
    pricing.ts             # Price calculation logic
    /ocr
      index.ts             # OCR strategy router
      mock.ts              # Demo OCR for Expo Go
      mlkit.ts             # ML Kit integration for Dev Client
    vedAi.ts               # Stubbed AI responses
  /store
    auth.ts                # Authentication state
    app.ts                 # App-level state (onboarding, location)
    cart.ts                # Shopping cart state
  /config
    types.ts               # TypeScript definitions and Zod schemas
  /utils
    date.ts                # Date formatting and parsing
    distance.ts            # Distance calculations
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project
- Google Maps API keys (Android & iOS)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd NiyatKalpa
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Firebase and Google Maps credentials:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID=your_android_key
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS=your_ios_key
   ```

3. **Firebase Setup**
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Enable Storage
   - Deploy security rules: `firebase deploy --only firestore:rules`

4. **Google Maps Setup**
   - Enable Maps SDK for Android/iOS
   - Enable Places API
   - Add API keys to your Firebase project

### Running the App

#### Expo Go (Recommended for Development)
```bash
npm start
```
- Scan QR code with Expo Go app
- OCR will use mock data for demo

#### Development Build (For ML Kit OCR)
```bash
# Create development build
npx expo install expo-dev-client
npx expo run:android  # or expo run:ios

# Install dev client on device, then:
npm start --dev-client
```

## 🔧 Configuration

### OCR Strategy

The app automatically switches between OCR implementations:

- **Expo Go**: Uses mock OCR with predefined medicine data
- **Dev Client**: Uses ML Kit Text Recognition (requires native build)

To add ML Kit support:
```bash
npx expo install expo-ml-kit
```

### Pricing Algorithm

Medicine prices are calculated based on expiry date:

- **> 180 days**: 30% discount
- **91-180 days**: 50% discount  
- **31-90 days**: 70% discount
- **≤ 30 days**: 80% discount

Minimum price: `max(10% of MRP, ₹5)`

### Security Rules

Firestore security ensures:
- Users can only access their own data
- Pharmacists can only modify their own listings
- Public can read active medicines
- Expiry dates cannot be modified after creation

## 📊 Data Models

### User
```typescript
{
  uid: string
  role: 'pharmacist' | 'user'
  name: string
  email: string
  phone?: string
  location?: { lat: number, lng: number, geohash: string, address?: string }
  createdAt: Timestamp
}
```

### Medicine
```typescript
{
  id: string
  name: string
  batchNo: string
  manufacturer: string
  expiryDate: Timestamp
  mrp: number
  price: number
  suggestedPrice: number
  quantity: number
  photos: string[]
  pharmacyId: string
  pharmacyName: string
  geo: { lat: number, lng: number, geohash: string }
  status: 'active' | 'paused' | 'soldout'
  description?: string
  createdAt: Timestamp
}
```

### Cart
```typescript
{
  items: Array<{
    medicineId: string
    name: string
    price: number
    qty: number
    photo: string
    pharmacyId: string
    pharmacyName: string
  }>
  updatedAt: Timestamp
}
```

## 🤖 Ved AI Assistant

The AI chat provides information about common medicines:

- **Supported medicines**: Paracetamol, Ibuprofen, Cetirizine, Amoxicillin, Metformin
- **Information provided**: Dosage, contraindications, side effects, precautions
- **Safety first**: Always recommends consulting healthcare professionals

To extend with real AI:
1. Replace `askVed()` function in `src/services/vedAi.ts`
2. Integrate with medical API or LLM service
3. Add proper medical disclaimers

## 🗺 Maps & Location

### Features
- Real-time location detection
- Pharmacy markers with medicine counts
- Distance calculations and sorting
- Geohash-based proximity queries

### Setup Requirements
- Enable location permissions in app.json
- Configure Google Maps API keys
- Test location services on physical device

## 🛡 Security & Privacy

### Data Protection
- Firebase Authentication for secure access
- Role-based Firestore security rules
- Location data encrypted and user-controlled
- No third-party data sharing

### Medical Compliance
- Clear expiry date warnings
- Safety disclaimers on all medicine information
- User responsibility declarations for pharmacists
- No medical diagnosis or prescription features

## 🚀 Deployment

### Expo Application Services (EAS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build:configure

# Build for app stores
eas build --platform all
```

### Firebase Deployment
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions (if added)
firebase deploy --only functions
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm test

# E2E tests (if configured)
npm run test:e2e
```

### Test Coverage
- Authentication flows
- OCR mock functionality  
- Price calculation logic
- Cart operations
- Location services

## 🔄 Development Workflow

### Code Quality
- TypeScript for type safety
- Zod schemas for runtime validation
- ESLint + Prettier for code formatting
- Husky for pre-commit hooks

### State Management
- Zustand for global state
- React Hook Form for form state
- AsyncStorage for persistence
- Firebase for server state

## 📈 Future Enhancements

### Planned Features
- **Delivery Integration**: Partner with delivery services
- **Payment Gateway**: Secure payment processing
- **Advanced AI**: Enhanced medical information
- **Prescription Upload**: Support for prescription medicines
- **Analytics Dashboard**: Usage and impact metrics
- **Multi-language Support**: Regional language support

### Technical Improvements
- **Push Notifications**: Medicine expiry alerts
- **Offline Support**: Cached data for poor connectivity
- **Performance Optimization**: Image compression and lazy loading
- **Advanced Search**: Elasticsearch integration
- **Real-time Chat**: Pharmacist-user communication

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow existing code style
- Test on both platforms

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo Team** for the amazing development platform
- **Firebase** for backend infrastructure
- **React Navigation** for seamless navigation
- **NativeWind** for beautiful styling
- **Medical Community** for inspiration to reduce waste

## 📞 Support

- **Email**: support@niyatkalpa.com
- **Issues**: GitHub Issues
- **Documentation**: This README
- **Community**: Discord Server (coming soon)

---

**NiyatKalpa** - *Reducing medical waste, improving healthcare access* 🌱

Built with ❤️ for better healthcare accessibility.
