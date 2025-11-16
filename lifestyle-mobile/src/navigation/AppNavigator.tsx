import '../utils/reanimatedCompat';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useMemo } from 'react';
import { AuthScreen, AuthStackParamList } from '../features/auth/AuthScreen';
import { ForgotPasswordScreen } from '../features/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../features/auth/ResetPasswordScreen';
import { AppText, LoadingView } from '../components';
import { useAuth } from '../providers/AuthProvider';
import { colors, fonts } from '../theme';
import { OverviewScreen } from '../features/overview/OverviewScreen';
import { ActivityScreen } from '../features/activity/ActivityScreen';
import { SessionsScreen } from '../features/sessions/SessionsScreen';
import { VitalsScreen } from '../features/vitals/VitalsScreen';
import { NutritionScreen } from '../features/nutrition/NutritionScreen';
import { WeightScreen } from '../features/weight/WeightScreen';
import { RosterScreen } from '../features/roster/RosterScreen';
import { ShareScreen } from '../features/share/ShareScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { AdminScreen } from '../features/admin/AdminScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

type DrawerParamList = {
  Overview: undefined;
  Activity: undefined;
  Sessions: undefined;
  Vitals: undefined;
  Nutrition: undefined;
  Weight: undefined;
  Roster: undefined;
  Share: undefined;
  Profile: undefined;
  Admin: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

export function AppNavigator() {
  const { user, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <View style={styles.loadingWrapper}>
        <LoadingView />
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator />;
  }

  return <DrawerNavigator />;
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="AuthLanding"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="AuthLanding" component={AuthScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function DrawerNavigator() {
  const { user, signOut } = useAuth();
  const isCoach = user?.role === 'Coach' || user?.role === 'Head Coach';
  const isHeadCoach = user?.role === 'Head Coach';

  return (
    <Drawer.Navigator
      useLegacyImplementation={false}
      initialRouteName="Overview"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerType: 'front',
        drawerStyle: { backgroundColor: colors.background },
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: fonts.display,
          fontSize: 20,
        },
        headerRight: () => (
          <TouchableOpacity style={styles.headerAction} onPress={signOut}>
            <AppText variant="label" style={styles.headerActionText}>
              Sign out
            </AppText>
          </TouchableOpacity>
        ),
      }}
    >
      <Drawer.Screen name="Overview" component={OverviewScreen} />
      <Drawer.Screen name="Activity" component={ActivityScreen} />
      <Drawer.Screen name="Sessions" component={SessionsScreen} />
      <Drawer.Screen name="Vitals" component={VitalsScreen} />
      <Drawer.Screen name="Nutrition" component={NutritionScreen} />
      <Drawer.Screen name="Weight" component={WeightScreen} />
      {isCoach ? <Drawer.Screen name="Roster" component={RosterScreen} /> : null}
      <Drawer.Screen name="Share" component={ShareScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      {isHeadCoach ? <Drawer.Screen name="Admin" component={AdminScreen} /> : null}
    </Drawer.Navigator>
  );
}

function CustomDrawerContent(props: any) {
  const { user, signOut } = useAuth();
  const drawerItems = useMemo(() => props.state?.routeNames || [], [props.state?.routeNames]);
  const mainRoutes = drawerItems.filter((route: string) => route !== 'Profile');
  const hasProfileRoute = drawerItems.includes('Profile');
  const initials =
    user?.name
      ?.split(' ')
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'A';
  const avatarUri = user?.avatar_photo
    ? `data:image/jpeg;base64,${user.avatar_photo}`
    : user?.avatar_url || null;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={styles.profileBlock}>
        <View style={styles.profileAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.profileAvatarImage} />
          ) : (
            <AppText variant="heading" style={styles.profileInitials}>
              {initials}
            </AppText>
          )}
        </View>
        <View>
          <AppText variant="label">Signed in as</AppText>
          <AppText variant="heading">{user?.name || 'Athlete'}</AppText>
          <AppText variant="muted">{user?.role}</AppText>
        </View>
      </View>
      {mainRoutes.map((route: string) => (
        <DrawerItem
          key={route}
          label={route}
          onPress={() => props.navigation.navigate(route)}
          labelStyle={styles.drawerLabel}
          focused={props.state?.routes?.[props.state.index]?.name === route}
          activeBackgroundColor="rgba(77,245,255,0.12)"
          inactiveTintColor={colors.muted}
        />
      ))}
      <View style={styles.settingsBlock}>
        {hasProfileRoute ? (
          <DrawerItem
            label="Settings"
            onPress={() => props.navigation.navigate('Profile')}
            labelStyle={styles.drawerLabel}
            focused={props.state?.routes?.[props.state.index]?.name === 'Profile'}
            activeBackgroundColor="rgba(77,245,255,0.12)"
            inactiveTintColor={colors.muted}
          />
        ) : null}
        <DrawerItem label="Sign out" onPress={signOut} labelStyle={styles.drawerLabel} />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  loadingWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  drawerContent: {
    paddingTop: 12,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileInitials: {
    color: colors.text,
  },
  drawerLabel: {
    color: colors.text,
  },
  settingsBlock: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  headerAction: {
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerActionText: {
    color: colors.text,
  },
});
