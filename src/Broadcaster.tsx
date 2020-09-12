import React, { useEffect } from 'react';
import io from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';
import { TransportOptions } from 'mediasoup-client/lib/Transport';

const url = 'http://167.172.144.55:5000';
const socket = io(url);

export function Broadcaster() {
  useEffect(() => {
    connect().catch(console.log);
  }, []);
  return <h1>broadcaster</h1>;
}

async function connect() {
  //step1
  const routerRtpCapabilities = (await sendRequest(
    'getRouterRtpCapabilities',
    {}
  )) as RtpCapabilities;
  //step2
  const device = new mediasoupClient.Device();
  await device.load({ routerRtpCapabilities });

  //step3
  const producerTransportParams = (await sendRequest(
    'createProducerTransport',
    {}
  )) as TransportOptions;
  //step4
  const localProducerTransport = device.createSendTransport(
    producerTransportParams
  );

  //step5
  localProducerTransport.on(
    'connect',
    ({ dtlsParameters }, callback, errback) => {
      sendRequest('connectProducerTransport', { dtlsParameters })
        .then(callback)
        .catch(errback);
    }
  );

  //step6
  localProducerTransport.on(
    'produce',
    async ({ kind, rtpParameters }, callback, errback) => {
      try {
        const { id } = (await sendRequest('produce', {
          transportId: localProducerTransport.id,
          kind,
          rtpParameters,
        })) as { id: string };
        callback({ id });
      } catch (err) {
        errback(err);
      }
    }
  );

  //step7
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
  const track = stream.getAudioTracks()[0];
  const producer = await localProducerTransport.produce({ track });
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
