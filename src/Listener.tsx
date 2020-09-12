import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';
import { TransportOptions } from 'mediasoup-client/lib/Transport';
import { ConsumerOptions } from 'mediasoup-client/lib/Consumer';

const url = 'http://167.172.144.55:5000';
const socket = io(url);

export function Listener() {
  const audioRef = useRef(null);
  // useEffect(() => {
  //   connect(audioRef.current).catch(console.log);
  // }, []);
  return (
    <>
      <h1>Listener</h1>
      <button onClick={(event) => connect(audioRef.current).catch(console.log)}>
        connect
      </button>
      <audio ref={audioRef} autoPlay={true} controls={true} />
    </>
  );
}

async function connect(audioElement: HTMLMediaElement | null) {
  //step 1
  const routerRtpCapabilities = (await sendRequest(
    'getRouterRtpCapabilities',
    {}
  )) as RtpCapabilities;

  //step2
  const device = new mediasoupClient.Device();
  await device.load({ routerRtpCapabilities });

  //step3
  const consumerTransportParams = (await sendRequest(
    'createConsumerTransport',
    {}
  )) as TransportOptions;
  //step4
  const localConsumerTransport = device.createRecvTransport(
    consumerTransportParams
  );

  //step5
  localConsumerTransport.on(
    'connect',
    async ({ dtlsParameters }, callback, errback) => {
      sendRequest('connectConsumerTransport', {
        dtlsParameters: dtlsParameters,
      })
        .then(callback)
        .catch(errback);
    }
  );

  //step6
  socket.on('newProducer', async () => {
    //step 6.a
    const consumerOption = (await sendRequest('createConsumer', {
      rtpCapabilities: device.rtpCapabilities,
    })) as ConsumerOptions;
    //step 6.b
    const localConsumer = await localConsumerTransport.consume(consumerOption);
    //step 6.c
    if (audioElement) {
      const newStream = new MediaStream();
      newStream.addTrack(localConsumer.track);
      audioElement.srcObject = newStream;
      await audioElement.play();
    }
  });
}

function sendRequest(type: string, data: any) {
  return new Promise((resolve, reject) => {
    socket.emit(type, data, (response: any) => {
      if (response.error) {
        reject(response);
      } else {
        resolve(response);
      }
    });
  });
}
