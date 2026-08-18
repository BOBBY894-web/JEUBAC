import { useState, useEffect } from 'react';
import { supabase } from '../supabase.js';

export function useMultiplayerRound(room: string) {
  const [letter, setLetter] = useState('');
    const [gameState, setGameState] = useState('waiting');

      useEffect(() => {
          if (!room) return;

              const channel = supabase.channel(room);

                  channel
                        .on('broadcast', { event: 'start' }, (payload) => {
                                setLetter(payload.payload.letter);
                                        setGameState('playing');
                                              })
                                                    .on('broadcast', { event: 'stop' }, () => {
                                                            setGameState('ended');
                                                                  })
                                                                        .subscribe();

                                                                            return () => {
                                                                                  supabase.removeChannel(channel);
                                                                                      };
                                                                                        }, [room]);

                                                                                          const startRound = () => {
                                                                                              const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                                                                                                  setLetter(randomLetter);
                                                                                                      setGameState('playing');
                                                                                                          
                                                                                                              supabase.channel(room).send({
                                                                                                                    type: 'broadcast',
                                                                                                                          event: 'start',
                                                                                                                                payload: { letter: randomLetter }
                                                                                                                                    });
                                                                                                                                      };

                                                                                                                                        const stopRound = () => {
                                                                                                                                            setGameState('ended');
                                                                                                                                                supabase.channel(room).send({
                                                                                                                                                      type: 'broadcast',
                                                                                                                                                            event: 'stop',
                                                                                                                                                                  payload: {}
                                                                                                                                                                      });
                                                                                                                                                                        };

                                                                                                                                                                          return { letter, gameState, startRound, stopRound };
                                                                                                                                                                          }
                                                                                                                                                                          