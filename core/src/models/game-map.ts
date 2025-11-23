import { ObjectId } from 'mongodb';
import { Hex } from './hex';
import { Planet } from './planet';
import { Station } from './station';

export interface GameMap {
  _id: ObjectId;
  gameId: ObjectId;
  
  name: string;
  radius: number; // Useful to know map bounds without loading all hexes
}