import { ObjectId } from 'mongodb';
import { Hex } from './hex';
import { Planet } from './planet';
import { Station } from './station';

export interface Map {
  _id: ObjectId;
  gameId: ObjectId;
  
  hexes: Hex[];
  planets: Planet[];
  stations: Station[];
}