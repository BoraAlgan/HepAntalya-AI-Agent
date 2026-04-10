import type { NavigatorScreenParams } from '@react-navigation/native';

export type PlacesStackParamList = {
  PlacesList: undefined;
  PlaceDetail: { placeId: string };
  Assistant: undefined;
};

export type RootTabParamList = {
  PlacesTab: NavigatorScreenParams<PlacesStackParamList> | undefined;
  FavoritesTab: undefined;
  AccountTab: undefined;
};
