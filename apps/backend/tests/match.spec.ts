// @ts-nocheck
/// <reference types="jest" />
import { io as Client, Socket } from 'socket.io-client';
import '../../index'; // starts server

describe('Matchmaking flow', () => {
  let p1: Socket;
  let p2: Socket;

  beforeAll(() => {
    p1 = Client('http://localhost:3001');
    p2 = Client('http://localhost:3001');
  });

  afterAll(() => {
    p1.close();
    p2.close();
  });

  it('pairs two clients and emits matchFound', done => {
    let got = 0;
    const doneCheck = () => { if (++got === 2) done(); };

    p1.on('matchFound', doneCheck);
    p2.on('matchFound', doneCheck);

    p1.emit('findMatch', {});
    p2.emit('findMatch', {});
  });
}); 